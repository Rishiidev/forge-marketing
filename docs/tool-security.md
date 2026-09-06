# Forge Free Tools — Security Contract (SSRF & Fetch Safety)

> Full detail behind `docs/tools-cost-policy.md` §H and
> `docs/tool-architecture.md`'s "Security and caching" section. This
> document covers exactly one thing in depth: what happens when a tool
> needs to fetch a URL the visitor supplied (a website, a Google
> Business Profile link), implemented in `lib/tools/security.ts`.
>
> Every claim below is backed by a test in
> `lib/tools/__tests__/security.test.ts` (29 tests) — re-run
> `npm run test` after touching `lib/tools/security.ts` and treat a
> failure there as a real regression, not a flaky test.

## Threat model

A tool that accepts a visitor-supplied URL and fetches it server-side is
a textbook SSRF (Server-Side Request Forgery) surface: without
mitigation, a visitor could supply `http://169.254.169.254/` (a cloud
metadata endpoint), `http://localhost:6379/` (an internal service), or a
hostname that resolves to an internal IP, and have Forge's own server
make that request on their behalf — potentially exposing internal
infrastructure, cloud credentials, or services never meant to be
internet-reachable.

This is independent of the zero-cost policy — it's a security
requirement regardless of what the tool costs to run, which is why it
has its own document rather than living only inside
`docs/tools-cost-policy.md`.

## What's rejected, and why

`validateUrlForFetch()` (`lib/tools/security.ts`) rejects, in order:

| Rejected | Why |
|---|---|
| Empty or missing URL | Nothing to validate |
| A URL longer than 2048 characters | Defensive cap against malformed/adversarial input — no legitimate business website URL needs more |
| A malformed URL (fails `new URL()`) | Nothing safe to fetch |
| Any protocol other than `http:`/`https:` | `file://`, `ftp://`, `data:`, `gopher://`, etc. can read local files or hit unintended protocols entirely |
| `localhost`, `*.localhost` | Never a real, publicly-reachable business website |
| `*.local`, `*.internal`, `*.lan`, `*.home`, `*.corp`, `*.localdomain` | Internal-network naming conventions, not real TLDs a business would use |
| `metadata.google.internal` | The GCP metadata hostname, named explicitly |
| A single-label hostname (no dot at all, e.g. `myserver`) | Never a real public domain — almost always resolved via a local search domain or `/etc/hosts` |
| **127.0.0.0/8** | IPv4 loopback |
| **10.0.0.0/8**, **172.16.0.0/12**, **192.168.0.0/16** | IPv4 private ranges (RFC 1918) |
| **169.254.0.0/16** | IPv4 link-local — **this is also the cloud metadata range** (`169.254.169.254` is AWS/Azure/GCP's metadata endpoint) |
| **0.0.0.0/8**, **100.64.0.0/10**, TEST-NET-1/2/3, multicast/reserved (`224.0.0.0/4`+) | Defense-in-depth beyond the explicitly-required list — none of these is a real public website either |
| **::1** (IPv6 loopback), **::** (unspecified) | IPv6 equivalents of the above |
| **fe80::/10** | IPv6 link-local |
| **fc00::/7** | IPv6 unique-local ("private") |
| An IPv4-mapped IPv6 address (`::ffff:a.b.c.d`) whose embedded IPv4 is itself disallowed | Closes the obvious bypass of the IPv4 checks above via IPv6 notation |
| A hostname whose **DNS resolution** returns any disallowed address | **The rebinding-resistant check** — a hostname's string can look completely innocent while still resolving to an internal address. String-matching the input alone (which `lib/validation.ts`'s client-safe `normalizeUrl()` already does, for basic well-formedness) is not sufficient; `dns.lookup(hostname, { all: true })` resolves **every** address the hostname has and rejects if **any** of them is disallowed. |

## `safeFetch()` — the only sanctioned way to fetch a visitor's URL

A tool's `run()` never calls the platform's raw `fetch()` on a
visitor-supplied URL. It calls `lib/tools/security.ts` `safeFetch()`,
which additionally implements:

- **HTTP/HTTPS only** — enforced by `validateUrlForFetch()` above, on
  every hop (see redirects, below).
- **A hard timeout** (default 8 seconds) via a single `AbortController`
  covering the *entire* operation, all redirects included — the same
  discipline `lib/crm.ts`'s webhook provider already applies
  (`WEBHOOK_TIMEOUT_MS`).
- **A redirect limit** (default 3) — **manual** redirect handling
  (`redirect: 'manual'`), never the platform's automatic
  redirect-following. Each redirect target is re-validated through the
  full `validateUrlForFetch()` check (scheme, hostname, DNS
  resolution) before being followed — a redirect is exactly as
  dangerous as the original URL and gets exactly the same scrutiny.
- **A response-size cap** (default 2MB) — the body is streamed and cut
  off via the response's own reader, never buffered unbounded before a
  cap is checked. `SafeFetchResult.truncated` tells the caller when this
  happened.
- **Content-Type validation** (default: only `text/html`) — checked
  from the response headers before the body is trusted, so a tool never
  accidentally parses a binary/unexpected payload as if it were HTML.
- **A descriptive `User-Agent`** (`ForgeFreeTools/1.0
  (+https://forge.bruuhh.com)`) — identifies these requests honestly to
  whatever site receives them, rather than spoofing a browser.

## No recursive crawling — homepage-only by design

This module deliberately exposes **no** "fetch and follow links"
helper. There is no `crawl()` function, no link-extraction-and-refetch
loop, nothing that turns one visitor-supplied URL into an unbounded
number of outbound requests.

`MAX_ANALYSIS_DEPTH = 1` is exported as a named constant specifically to
make this a documented architectural decision, not an accidental
omission: a tool's `run()` calls `safeFetch()` a small, fixed number of
times **it controls itself** (in practice: once, for the homepage) —
never in a loop over `href`s discovered in a fetched page. If a future
tool genuinely needs to check more than the homepage (e.g. "does this
site have a privacy policy page"), that's a small, fixed number of
named, hard-coded candidate paths the tool itself chooses (e.g.
`/privacy`, `/privacy-policy`) — never visitor-influenced, never
discovered by parsing the previous response.

## Known limitations — stated plainly, matching this project's convention

This codebase's standing practice (`lib/rate-limit.ts`,
`lib/file-store.ts`) is to state a real limitation directly rather than
imply a guarantee that doesn't hold. Two apply here:

1. **DNS-resolution-then-fetch is not perfectly atomic (TOCTOU).**
   `validateUrlForFetch()` resolves the hostname and checks every
   address *before* the request is made — but the platform's own
   `fetch()` performs its own DNS resolution when the request actually
   goes out, moments later. A sufficiently well-timed DNS-rebinding
   attack (changing what a hostname resolves to between the validation
   lookup and the fetch) is a known, narrow gap this implementation
   does not close, because doing so would require pinning the resolved
   IP into the actual socket connection — not available through the
   standard `fetch()` API without a custom `dispatcher`/agent, which
   this project has not added (that would be exactly the kind of
   "unnecessary backend infrastructure" `docs/architecture.md` already
   argues against adding speculatively). Mitigating factors: the window
   is small (milliseconds), the target must control DNS for a domain a
   real visitor supplied, and every fetched response is still further
   constrained (size cap, content-type check, never reflected
   unsanitized — see below). If this ever needs closing fully, the fix
   is a custom `fetch` dispatcher that connects to the already-resolved
   IP directly — a real change, not a config flag, and should be a
   deliberate follow-up, not silently assumed to already be true.
2. **The response body is never trusted or reflected unsanitized.**
   Even after every check above passes, the fetched HTML is untrusted
   third-party content. A tool's `run()` must treat it as data to parse
   (e.g. regex/DOM-parse for specific facts), never render it directly
   into a page — the same XSS-adjacent discipline
   `lib/seo.ts` `jsonLdScript()`'s escaping comment already documents
   for a different reason (structured data, not fetched HTML), applied
   here to a genuinely untrusted source instead of site-authored
   content.

## Using this from a tool

```ts
import { safeFetch } from '@/lib/tools/security'
import { verifiedFinding, failedFinding } from '@/lib/tools/results'

// Inside a tool's run():
try {
  const { body } = await safeFetch(input.websiteUrl as string)
  const hasViewportTag = /<meta[^>]+name=["']viewport["']/i.test(body)
  return buildToolResult({
    toolSlug: 'example',
    summary: '...',
    findings: [
      hasViewportTag
        ? verifiedFinding({ id: 'viewport', label: 'Mobile viewport tag', detail: 'Found on the homepage.' })
        : verifiedFinding({ id: 'viewport', label: 'Mobile viewport tag', detail: 'Not found on the homepage.', severity: 'warning' }),
    ],
  })
} catch (err) {
  // toToolError() (lib/tools/errors.ts) normalizes this — a caught
  // SSRF_BLOCKED/TIMEOUT/UPSTREAM_UNAVAILABLE ToolError, or an unknown
  // exception. lib/tools/execution.ts's executeTool() also does this
  // automatically if a tool lets the error propagate instead.
  throw err
}
```

Note `verifiedFinding()`, not `inferredFinding()` — because
`safeFetch()` genuinely, directly confirmed what the homepage's HTML
contains. A tool that instead asks the visitor to self-report the same
fact (no fetch at all) must use `inferredFinding()` for that
capability — the honesty contract in
[`docs/tool-architecture.md`](tool-architecture.md) applies regardless
of which data source produced the finding.
