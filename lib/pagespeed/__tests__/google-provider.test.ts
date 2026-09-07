import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

/**
 * Mocks lib/tools/security.ts's validateUrlForFetch (already fully
 * tested in its own suite, lib/tools/__tests__/security.test.ts) so
 * these tests exercise google-provider.ts's own logic in isolation —
 * and mocks global fetch so this suite makes zero real calls to Google,
 * per the task's own explicit instruction.
 */
vi.mock('@/lib/tools/security', () => ({
  validateUrlForFetch: vi.fn(async (url: string) => (url.includes('invalid') ? { ok: false, reason: 'bad' } : { ok: true, url: new URL(url) })),
}))

import { googlePageSpeedProvider } from '../google-provider'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('googlePageSpeedProvider.isConfigured()', () => {
  it('false when PSI_API_KEY is unset', () => {
    delete process.env.PSI_API_KEY
    expect(googlePageSpeedProvider.isConfigured()).toBe(false)
  })

  it('true when PSI_API_KEY is set', () => {
    process.env.PSI_API_KEY = 'test-key'
    expect(googlePageSpeedProvider.isConfigured()).toBe(true)
  })
})

describe('googlePageSpeedProvider.analyze() — never calls Google without a key', () => {
  it('returns unavailable/not-configured and makes no fetch call at all when no key is set', async () => {
    delete process.env.PSI_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'not-configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('googlePageSpeedProvider.analyze() — with a key, mocked responses only', () => {
  beforeEach(() => {
    process.env.PSI_API_KEY = 'test-key'
  })

  it('rejects an invalid URL before ever calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await googlePageSpeedProvider.analyze('https://invalid.example', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'invalid-url' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizes a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(200, {
          lighthouseResult: {
            categories: { performance: { score: 0.9 } },
            audits: { 'largest-contentful-paint': { numericValue: 2000, displayValue: '2.0 s' } },
          },
        })
      )
    )
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result.status).toBe('ok')
  })

  it('returns unavailable/quota-exceeded on a 429', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })))
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'quota-exceeded' })
  })

  it('returns unavailable/http-500 on a server error, never a fabricated result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'http-500' })
  })

  it('returns unavailable/timeout when the request is aborted', async () => {
    // Can't wait the real 25s timeout in a test — simulate what it
    // ultimately produces (fetch rejecting with a named AbortError)
    // directly, rather than actually waiting out the AbortController.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const err = new Error('aborted')
        err.name = 'AbortError'
        throw err
      })
    )
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'timeout' })
  })

  it('returns unavailable/network-error on a generic fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('DNS failure')
      })
    )
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'network-error' })
  })

  it('returns unavailable/invalid-response when Google returns non-JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json{{{', { status: 200 })))
    const result = await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    expect(result).toEqual({ status: 'unavailable', reason: 'invalid-response' })
  })

  it('sends the API key and the three requested categories, never "seo"', async () => {
    // The param is unused inside the mock but required so TS infers
    // `fetchMock.mock.calls[0]` as a real tuple (the actual URL is
    // asserted on below, via the mock's recorded call args instead).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchMock = vi.fn(async (_url: string) => jsonResponse(200, { lighthouseResult: { categories: {}, audits: {} } }))
    vi.stubGlobal('fetch', fetchMock)
    await googlePageSpeedProvider.analyze('https://example.com', 'mobile')
    const calledUrl = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(calledUrl.searchParams.get('key')).toBe('test-key')
    expect(calledUrl.searchParams.getAll('category')).toEqual(['performance', 'accessibility', 'best-practices'])
    expect(calledUrl.searchParams.getAll('category')).not.toContain('seo')
  })
})
