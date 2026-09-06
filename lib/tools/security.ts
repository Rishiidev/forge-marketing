import 'server-only'
import dns from 'node:dns/promises'
import net from 'node:net'
import { makeToolError, TOOL_ERROR_CODES } from './errors'

/**
 * SSRF-safe URL validation and fetching for any tool that accepts a
 * visitor-supplied URL (a website, a Google Business Profile link) and
 * needs to fetch it server-side. Full rationale and threat model:
 * docs/tool-security.md. This module is the concrete implementation of
 * docs/tools-cost-policy.md §H.
 *
 * Server-only: uses node:dns to resolve hostnames before deciding
 * whether a request is safe to make — a hostname's *string* can look
 * innocent while still resolving to an internal address (DNS
 * rebinding), so string-matching the input alone (as
 * lib/validation.ts's normalizeUrl() already does, client-safe, for
 * basic well-formedness) is not sufficient here.
 *
 * Zero-cost: node:dns and node:net are Node built-ins — no dependency,
 * no API key, no network call beyond the DNS lookup and the fetch
 * itself, per docs/tools-cost-policy.md §B.
 */

const MAX_URL_LENGTH = 2048
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

// Hostname suffixes that are never a real, publicly-reachable business
// website — internal-network naming conventions, not a real TLD.
const DISALLOWED_HOSTNAME_SUFFIXES = ['.local', '.internal', '.lan', '.home', '.corp', '.localdomain']
const DISALLOWED_EXACT_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', '0'])

// A visitor-supplied "website" with no dot at all (a single label, e.g.
// "myserver") is never a real public domain — almost always an internal
// hostname resolved via a local search domain or /etc/hosts entry.
function isSingleLabelHostname(hostname: string): boolean {
  return !hostname.includes('.') && hostname !== '::1'
}

function ipv4ToOctets(ip: string): number[] | null {
  if (!net.isIPv4(ip)) return null
  return ip.split('.').map(Number)
}

/**
 * Reject a resolved IPv4 address in any private, loopback, link-local
 * (including the 169.254.169.254 cloud metadata endpoint every major
 * cloud provider uses), carrier-grade-NAT, "this network", documentation/
 * test-net, multicast, or reserved range. This is the core of
 * docs/tools-cost-policy.md §H item 2.
 */
function isDisallowedIPv4(ip: string): boolean {
  const octets = ipv4ToOctets(ip)
  if (!octets || octets.length !== 4) return true // unparsable — fail closed
  const [a, b] = octets as [number, number, number, number]

  if (a === 127) return true // 127.0.0.0/8 loopback
  if (a === 10) return true // 10.0.0.0/8 private
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true // 192.168.0.0/16 private
  if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local + cloud metadata (169.254.169.254)
  if (a === 0) return true // 0.0.0.0/8 "this network"
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 carrier-grade NAT
  if (a === 192 && b === 0 && octets[2] === 0) return true // 192.0.0.0/24 IETF protocol assignments
  if (a === 192 && b === 0 && octets[2] === 2) return true // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true // 198.18.0.0/15 benchmarking
  if (a === 198 && b === 51 && octets[2] === 100) return true // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && octets[2] === 113) return true // 203.0.113.0/24 TEST-NET-3
  if (a >= 224) return true // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved, 255.255.255.255 broadcast

  return false
}

/**
 * Reject a resolved IPv6 address that is loopback (::1), unspecified
 * (::), link-local (fe80::/10), unique-local/"private" (fc00::/7 —
 * fd00::/8 is the commonly-assigned half), the documented AWS IMDSv2
 * IPv6 metadata address (fd00:ec2::254, itself inside fc00::/7 so
 * already covered but named explicitly per the requirement), or an
 * IPv4-mapped address (::ffff:a.b.c.d) whose embedded IPv4 is itself
 * disallowed.
 */
/**
 * Expands a (possibly `::`-compressed) IPv6 address into its 8 hextets.
 * Needed because the WHATWG URL parser (and dns.lookup's results)
 * normalize IPv4-mapped addresses into pure hex — `::ffff:127.0.0.1`
 * becomes `::ffff:7f00:1`, not the dotted-quad form a naive regex would
 * expect — so unwrapping the embedded IPv4 has to work on hex groups,
 * not string-match the dotted form.
 */
function expandIPv6Groups(address: string): string[] | null {
  const parts = address.split('::')
  if (parts.length > 2) return null // more than one '::' is invalid

  const left = parts[0] ? parts[0].split(':') : []
  const right = parts.length === 2 && parts[1] ? parts[1].split(':') : []

  if (parts.length === 1) {
    // No compression — must be exactly 8 groups.
    return left.length === 8 ? left : null
  }

  const missing = 8 - (left.length + right.length)
  if (missing < 0) return null
  return [...left, ...Array(missing).fill('0'), ...right]
}

function isDisallowedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true // loopback / unspecified

  const groups = expandIPv6Groups(normalized)
  if (!groups) return true // couldn't expand — fail closed

  // IPv4-mapped IPv6 (::ffff:a.b.c.d, stored as 0:0:0:0:0:ffff:HHHH:LLLL
  // once expanded/normalized) — unwrap the embedded IPv4 and re-check it
  // against the same IPv4 ranges, so ::ffff:127.0.0.1 is caught exactly
  // like a plain 127.0.0.1 would be.
  const isV4Mapped = groups.slice(0, 5).every((g) => g === '0' || g === '0000') && groups[5] === 'ffff'
  if (isV4Mapped) {
    const high = parseInt(groups[6] ?? '0', 16)
    const low = parseInt(groups[7] ?? '0', 16)
    const embeddedIPv4 = [(high >> 8) & 0xff, high & 0xff, (low >> 8) & 0xff, low & 0xff].join('.')
    return isDisallowedIPv4(embeddedIPv4)
  }

  const firstHextet = parseInt(groups[0] || '0', 16)
  if (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) return true // fe80::/10 link-local
  if (firstHextet >= 0xfc00 && firstHextet <= 0xfdff) return true // fc00::/7 unique-local ("private")

  return false
}

function isDisallowedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isDisallowedIPv4(ip)
  if (net.isIPv6(ip)) return isDisallowedIPv6(ip)
  return true // couldn't classify — fail closed
}

export interface UrlValidationResult {
  ok: boolean
  url?: URL
  reason?: string
}

/**
 * Full SSRF-safe validation for one URL: scheme, length, hostname
 * denylist, and (the part that actually stops DNS rebinding) resolving
 * the hostname and checking every returned address. Call this for the
 * visitor's original input AND for every redirect hop — see safeFetch()
 * below, which does both.
 */
export async function validateUrlForFetch(rawUrl: string): Promise<UrlValidationResult> {
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
    return { ok: false, reason: 'URL is missing or too long.' }
  }

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'Malformed URL.' }
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: `Unsupported protocol "${url.protocol}" — only http/https are allowed.` }
  }

  const hostname = url.hostname.toLowerCase()
  // WHATWG URL keeps the brackets on an IPv6 hostname (e.g. "[::1]") —
  // strip them for IP-literal detection so net.isIP()/dns.lookup() see
  // the actual address, not a string that looks like neither an IP nor
  // a normal domain (which would otherwise wrongly fall through to the
  // domain-name heuristics below, e.g. the "no dot = single label"
  // check, for a perfectly valid IPv6 literal).
  const ipCandidate = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname

  // If the hostname is already a literal IP, check it directly — no DNS
  // lookup needed, and none of the domain-name heuristics below apply to
  // an IP literal (an IPv6 address has colons, not dots, and isn't a
  // "domain" at all).
  if (net.isIP(ipCandidate)) {
    if (isDisallowedIp(ipCandidate)) return { ok: false, reason: 'This address is not allowed.' }
    return { ok: true, url }
  }

  if (DISALLOWED_EXACT_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: 'This host is not allowed.' }
  }
  if (DISALLOWED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return { ok: false, reason: 'This host is not allowed.' }
  }
  if (isSingleLabelHostname(hostname)) {
    return { ok: false, reason: 'This host is not allowed.' }
  }

  // Resolve the hostname and check every address it comes back with —
  // the DNS-rebinding-resistant step. A hostname can have multiple A/AAAA
  // records; all of them must be publicly-routable, non-internal.
  let addresses: { address: string }[]
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true })
  } catch {
    return { ok: false, reason: 'Could not resolve this host.' }
  }
  if (addresses.length === 0) {
    return { ok: false, reason: 'Could not resolve this host.' }
  }
  if (addresses.some((a) => isDisallowedIp(a.address))) {
    return { ok: false, reason: 'This host resolves to a disallowed address.' }
  }

  return { ok: true, url }
}

// ============================================================
// safeFetch — the only way a tool's server-side run() should ever fetch
// a visitor-supplied URL. See docs/tool-security.md for the full
// contract this implements.
// ============================================================

export interface SafeFetchOptions {
  /** Default 8s — a hard ceiling covering the whole operation, all redirect hops included, via a single AbortController. */
  timeoutMs?: number
  /** Default 3 — each hop is independently re-validated with validateUrlForFetch() before being followed. */
  maxRedirects?: number
  /** Default 2MB — the response body is streamed and cut off, not buffered unbounded. */
  maxResponseBytes?: number
  /** Default ['text/html'] — any other Content-Type is rejected before the body is read. */
  allowedContentTypePrefixes?: readonly string[]
  /** Default 'GET'. 'HEAD' is useful for a lightweight reachability check (e.g. lib/website-analyzer/links.ts) that never needs a body. */
  method?: 'GET' | 'HEAD'
}

export interface SafeFetchResult {
  finalUrl: string
  status: number
  contentType: string
  /** Truncated at maxResponseBytes if the real response was larger — never silently the full body if it exceeded the cap. */
  body: string
  truncated: boolean
  /** Every URL actually visited before the final one, in order — empty when there was no redirect. Each hop was independently re-validated (see the manual redirect handling below), so this is also a record of what passed that check. */
  redirectChain: string[]
  /** Wall-clock time for the whole operation, all redirect hops included. */
  responseTimeMs: number
  /** Plain object of the final response's headers — lowercase keys, per the Headers API. */
  headers: Record<string, string>
}

const DEFAULT_OPTIONS: Required<SafeFetchOptions> = {
  timeoutMs: 8000,
  maxRedirects: 3,
  maxResponseBytes: 2_000_000,
  allowedContentTypePrefixes: ['text/html'],
  method: 'GET',
}

/**
 * This module deliberately exposes no "fetch and follow links" helper.
 * Analysis depth is enforced by omission: a tool's run() calls
 * safeFetch() a small, fixed number of times it controls itself (e.g.
 * once, for the homepage) — never in a loop over hrefs discovered in a
 * fetched page. See docs/tool-security.md "No recursive crawling."
 */
export const MAX_ANALYSIS_DEPTH = 1 as const

/**
 * Fetches one URL under a full SSRF-safe policy: scheme/host/DNS
 * validation (both the original URL and every redirect hop), a hard
 * timeout via AbortController, a capped number of redirects, a response
 * size cap, and Content-Type validation before the body is trusted.
 * Throws a ToolError (see lib/tools/errors.ts) rather than a raw
 * exception — a tool's run() should let this propagate and rely on
 * lib/tools/execution.ts to normalize it, or catch it to add a
 * tool-specific fallback finding.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const { timeoutMs, maxRedirects, maxResponseBytes, allowedContentTypePrefixes, method } = { ...DEFAULT_OPTIONS, ...opts }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()

  try {
    let currentUrl = rawUrl
    let redirectCount = 0
    const redirectChain: string[] = []

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const validation = await validateUrlForFetch(currentUrl)
      if (!validation.ok || !validation.url) {
        throw makeToolError(TOOL_ERROR_CODES.SSRF_BLOCKED, validation.reason ?? 'This URL is not allowed.')
      }

      let response: Response
      try {
        response = await fetch(validation.url, {
          method,
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': 'ForgeFreeTools/1.0 (+https://forge.bruuhh.com)' },
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw makeToolError(TOOL_ERROR_CODES.TIMEOUT, 'The site took too long to respond.')
        }
        throw makeToolError(TOOL_ERROR_CODES.UPSTREAM_UNAVAILABLE, 'Could not reach that site.')
      }

      // Manual redirect handling — never let the platform's fetch follow
      // a redirect on our behalf, because that would skip revalidating
      // the target against the same SSRF checks. See §H item 3.
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        redirectCount += 1
        if (redirectCount > maxRedirects) {
          throw makeToolError(TOOL_ERROR_CODES.UPSTREAM_UNAVAILABLE, 'Too many redirects.')
        }
        redirectChain.push(validation.url.toString())
        currentUrl = new URL(response.headers.get('location')!, validation.url).toString()
        continue
      }

      const contentType = response.headers.get('content-type') ?? ''
      // A HEAD request has no body to validate/read at all — used by
      // lib/website-analyzer/links.ts purely for a status-code check.
      if (method === 'HEAD') {
        return {
          finalUrl: validation.url.toString(),
          status: response.status,
          contentType,
          body: '',
          truncated: false,
          redirectChain,
          responseTimeMs: Date.now() - startedAt,
          headers: Object.fromEntries(response.headers.entries()),
        }
      }

      if (!allowedContentTypePrefixes.some((prefix) => contentType.startsWith(prefix))) {
        throw makeToolError(TOOL_ERROR_CODES.UNSUPPORTED_CONTENT_TYPE, 'That page is not a type this tool can read.')
      }

      const { text, truncated } = await readBodyWithCap(response, maxResponseBytes)
      return {
        finalUrl: validation.url.toString(),
        status: response.status,
        contentType,
        body: text,
        truncated,
        redirectChain,
        responseTimeMs: Date.now() - startedAt,
        headers: Object.fromEntries(response.headers.entries()),
      }
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function readBodyWithCap(response: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  const reader = response.body?.getReader()
  if (!reader) {
    const text = await response.text()
    const bytes = new TextEncoder().encode(text)
    if (bytes.length <= maxBytes) return { text, truncated: false }
    return { text: new TextDecoder().decode(bytes.slice(0, maxBytes)), truncated: true }
  }

  const chunks: Uint8Array[] = []
  let received = 0
  let truncated = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    received += value.byteLength
    if (received > maxBytes) {
      const remaining = maxBytes - (received - value.byteLength)
      if (remaining > 0) chunks.push(value.slice(0, remaining))
      truncated = true
      await reader.cancel().catch(() => undefined)
      break
    }
    chunks.push(value)
  }

  const total = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    total.set(chunk, offset)
    offset += chunk.length
  }
  return { text: new TextDecoder().decode(total), truncated }
}
