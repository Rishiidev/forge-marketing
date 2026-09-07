import 'server-only'
import crypto from 'node:crypto'
import { readStore, writeStore } from '@/lib/file-store'
import type { PageSpeedAnalysis, PageSpeedStrategy } from './provider'

/**
 * Zero-cost, file-backed cache for PageSpeed results — same
 * lib/file-store.ts pattern lib/website-analyzer/analyzer.ts already
 * uses, for the same reason (ADR-013: a bare in-memory Map doesn't
 * reliably survive a Route-Handler/Server-Action boundary in this
 * framework).
 *
 * A longer TTL than the general website-analyzer cache (12h vs. 6h) —
 * deliberately, for two reasons: (1) a real Lighthouse run is Google's
 * own quota-metered, slow (10-20s+) operation, worth reusing
 * aggressively; (2) CrUX field data is itself a 28-day rolling average,
 * so it does not meaningfully change hour to hour — caching it for 12h
 * loses nothing real.
 *
 * Cached only by (URL + strategy) — a hash of public inputs, nothing
 * about *who* asked. This is the concrete answer to "do not cache
 * private/customer-specific data incorrectly": there is no visitor
 * identity, session, IP, or lead data anywhere in the cache key or the
 * cached value — a PageSpeed result for a public URL is exactly as
 * public as the page itself, and every viewer of the same URL gets the
 * same cached result on purpose (the same trade-off
 * lib/website-analyzer/analyzer.ts's cache already makes, documented
 * there identically).
 */

const CACHE_FILE = 'pagespeed-cache.json'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

interface CacheEntry {
  analysis: PageSpeedAnalysis
  expiresAt: string
}

function cacheKeyFor(url: string, strategy: PageSpeedStrategy): string {
  return crypto.createHash('sha256').update(`${strategy}:${url.trim().toLowerCase()}`).digest('hex')
}

export function getCachedAnalysis(url: string, strategy: PageSpeedStrategy): PageSpeedAnalysis | null {
  const store = readStore<CacheEntry>(CACHE_FILE)
  const entry = store[cacheKeyFor(url, strategy)]
  if (!entry) return null
  if (Date.parse(entry.expiresAt) <= Date.now()) return null
  return entry.analysis
}

/** Never caches an 'unavailable' result caused by a transient failure (timeout/network/5xx) — only a genuine, complete answer (or a stable 'not-configured'/'invalid-url' outcome) is worth serving stale for 12 hours; a transient hiccup should let the very next visitor try again for real. */
export function setCachedAnalysis(url: string, strategy: PageSpeedStrategy, analysis: PageSpeedAnalysis): void {
  if (analysis.status === 'unavailable' && (analysis.reason === 'timeout' || analysis.reason === 'network-error' || analysis.reason.startsWith('http-5'))) {
    return
  }
  const store = readStore<CacheEntry>(CACHE_FILE)
  store[cacheKeyFor(url, strategy)] = { analysis, expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString() }
  writeStore(CACHE_FILE, store)
}
