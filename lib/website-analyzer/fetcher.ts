import 'server-only'
import { safeFetch, HOMEPAGE_FETCH_OPTIONS } from './security'
import type { Finding } from './types'

/**
 * Fetches the homepage itself and turns the raw response into both (a)
 * normalized HTTP evidence every other check module needs (final URL,
 * whether it's HTTPS, etc.) and (b) the 'http'-category findings
 * (docs CHECK §1) — the one category that doesn't need HTML parsing at
 * all, since it's about the response itself.
 */

export interface HttpEvidence {
  status: number
  finalUrl: string
  requestedUrl: string
  redirectChain: string[]
  responseTimeMs: number
  contentType: string
  https: boolean
  headers: Record<string, string>
  body: string
  truncated: boolean
}

export async function fetchHomepage(requestedUrl: string): Promise<HttpEvidence> {
  const result = await safeFetch(requestedUrl, HOMEPAGE_FETCH_OPTIONS)
  return {
    status: result.status,
    finalUrl: result.finalUrl,
    requestedUrl,
    redirectChain: result.redirectChain,
    responseTimeMs: result.responseTimeMs,
    contentType: result.contentType,
    https: new URL(result.finalUrl).protocol === 'https:',
    headers: result.headers,
    body: result.body,
    truncated: result.truncated,
  }
}

/** Builds the 'http'-category findings — status, HTTPS, redirects, response time. Pure function of already-fetched evidence, no I/O of its own. */
export function buildHttpFindings(evidence: HttpEvidence): Finding[] {
  const findings: Finding[] = []

  findings.push({
    id: 'http-status',
    category: 'http',
    severity: evidence.status >= 200 && evidence.status < 300 ? 'good' : evidence.status < 400 ? 'info' : 'critical',
    title: 'Homepage response',
    whatWeFound:
      evidence.status >= 200 && evidence.status < 300
        ? `Your homepage responded successfully (HTTP ${evidence.status}).`
        : `Your homepage responded with HTTP ${evidence.status}.`,
    whyItMatters:
      evidence.status >= 200 && evidence.status < 300
        ? 'A healthy response code is the baseline every other check on this page depends on.'
        : 'Search engines and visitors both expect a normal, successful response — anything else can mean the page is broken, blocked, or misconfigured.',
    recommendedAction: evidence.status >= 200 && evidence.status < 300 ? 'Nothing to do here.' : 'Check with whoever manages your hosting or website — this response code usually points to a real, fixable problem.',
    evidence: { status: evidence.status, finalUrl: evidence.finalUrl },
    confidence: 'verified',
    status: evidence.status >= 200 && evidence.status < 300 ? 'PASS' : 'FAIL',
  })

  findings.push({
    id: 'http-https',
    category: 'http',
    severity: evidence.https ? 'good' : 'critical',
    title: 'Secure connection (HTTPS)',
    whatWeFound: evidence.https ? 'Your site loads over a secure (HTTPS) connection.' : 'Your site does not load over a secure (HTTPS) connection.',
    whyItMatters: evidence.https
      ? 'Visitors see a secure padlock, and browsers/search engines both treat this as a baseline trust signal.'
      : "Most browsers now flag non-HTTPS sites as 'Not Secure' directly in the address bar — a real trust cost before a visitor even reads a word.",
    recommendedAction: evidence.https ? 'Nothing to do here.' : 'Set up a free SSL certificate (most hosts offer one, e.g. via Let’s Encrypt) so your site loads over HTTPS.',
    evidence: { finalUrl: evidence.finalUrl },
    confidence: 'verified',
    status: evidence.https ? 'PASS' : 'FAIL',
  })

  if (evidence.redirectChain.length > 0) {
    findings.push({
      id: 'http-redirects',
      category: 'http',
      severity: evidence.redirectChain.length > 2 ? 'warning' : 'info',
      title: 'Redirects before loading',
      whatWeFound: `Your homepage redirected ${evidence.redirectChain.length} time${evidence.redirectChain.length > 1 ? 's' : ''} before reaching its final address.`,
      whyItMatters: 'Every redirect adds a small delay before a visitor sees anything — one is normal (e.g. http → https), several in a row is usually a sign of a misconfiguration worth cleaning up.',
      recommendedAction: evidence.redirectChain.length > 2 ? 'Ask whoever manages your DNS/hosting to point the requested address directly at the final one, removing the extra hops.' : 'Nothing urgent — a single redirect is normal.',
      evidence: { redirectChain: evidence.redirectChain, finalUrl: evidence.finalUrl },
      confidence: 'verified',
      status: evidence.redirectChain.length > 2 ? 'PARTIAL' : 'PASS',
    })
  }

  findings.push({
    id: 'http-response-time',
    category: 'http',
    severity: evidence.responseTimeMs > 3000 ? 'warning' : 'good',
    title: 'Response time',
    whatWeFound: `Your homepage took about ${(evidence.responseTimeMs / 1000).toFixed(1)}s to respond.`,
    whyItMatters: 'A slow first response delays everything else on the page — visitors and search engines both notice.',
    recommendedAction: evidence.responseTimeMs > 3000 ? 'This is slower than ideal — ask your host about server response time, or consider a faster hosting plan.' : 'Nothing to do here.',
    evidence: { responseTimeMs: evidence.responseTimeMs },
    confidence: 'verified',
    status: evidence.responseTimeMs > 3000 ? 'PARTIAL' : 'PASS',
  })

  return findings
}
