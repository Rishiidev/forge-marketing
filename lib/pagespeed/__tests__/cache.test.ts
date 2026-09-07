import { describe, expect, it, beforeEach, vi } from 'vitest'

const store: Record<string, Record<string, unknown>> = {}

vi.mock('@/lib/file-store', () => ({
  readStore: (file: string) => store[file] ?? {},
  writeStore: (file: string, data: Record<string, unknown>) => {
    store[file] = data
  },
}))

import { getCachedAnalysis, setCachedAnalysis } from '../cache'
import type { PageSpeedAnalysis } from '../provider'

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key]
})

const okAnalysis: PageSpeedAnalysis = {
  status: 'ok',
  strategy: 'mobile',
  lab: { categories: {}, coreWebVitals: {}, opportunities: [], diagnostics: [], fetchedAt: new Date().toISOString() },
  field: null,
}

describe('getCachedAnalysis()/setCachedAnalysis() — public URL data only, never keyed by visitor identity', () => {
  it('returns null for a URL never cached', () => {
    expect(getCachedAnalysis('https://example.com', 'mobile')).toBeNull()
  })

  it('round-trips a real result', () => {
    setCachedAnalysis('https://example.com', 'mobile', okAnalysis)
    expect(getCachedAnalysis('https://example.com', 'mobile')).toEqual(okAnalysis)
  })

  it('caches mobile and desktop independently for the same URL', () => {
    setCachedAnalysis('https://example.com', 'mobile', okAnalysis)
    expect(getCachedAnalysis('https://example.com', 'desktop')).toBeNull()
  })

  it('the cache key is case/whitespace-normalized (same URL, different casing, hits the same entry)', () => {
    setCachedAnalysis('https://Example.com/', 'mobile', okAnalysis)
    expect(getCachedAnalysis('  https://example.com/  ', 'mobile')).toEqual(okAnalysis)
  })

  it('does not cache a transient failure (timeout) — the next visitor should get a real retry, not a stale failure', () => {
    setCachedAnalysis('https://example.com', 'mobile', { status: 'unavailable', reason: 'timeout' })
    expect(getCachedAnalysis('https://example.com', 'mobile')).toBeNull()
  })

  it('does not cache a network error or a 5xx', () => {
    setCachedAnalysis('https://a.com', 'mobile', { status: 'unavailable', reason: 'network-error' })
    setCachedAnalysis('https://b.com', 'mobile', { status: 'unavailable', reason: 'http-503' })
    expect(getCachedAnalysis('https://a.com', 'mobile')).toBeNull()
    expect(getCachedAnalysis('https://b.com', 'mobile')).toBeNull()
  })

  it('does cache a stable "not-configured" outcome — retrying won\'t change it until a human sets a key', () => {
    setCachedAnalysis('https://example.com', 'mobile', { status: 'unavailable', reason: 'not-configured' })
    expect(getCachedAnalysis('https://example.com', 'mobile')).toEqual({ status: 'unavailable', reason: 'not-configured' })
  })

  it('an expired entry is treated as absent', () => {
    // Write directly with an already-past expiry to avoid depending on
    // real wall-clock time / fake timers for a 12-hour TTL.
    store['pagespeed-cache.json'] = {}
    setCachedAnalysis('https://example.com', 'mobile', okAnalysis)
    const key = Object.keys(store['pagespeed-cache.json']!)[0]!
    ;(store['pagespeed-cache.json']![key] as { expiresAt: string }).expiresAt = new Date(Date.now() - 1000).toISOString()
    expect(getCachedAnalysis('https://example.com', 'mobile')).toBeNull()
  })
})
