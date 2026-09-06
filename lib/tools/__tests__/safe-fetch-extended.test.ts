import { describe, expect, it, vi, afterEach } from 'vitest'
import { safeFetch } from '../security'

/**
 * Covers the safeFetch() behavior lib/website-analyzer/ depends on that
 * lib/tools/__tests__/security.test.ts (from the original tools-engine
 * phase) doesn't: redirect-chain capture, response timing, header
 * exposure, the response-size cap, HEAD requests, and timeout handling.
 *
 * Targets a real public IP literal (8.8.8.8) so validateUrlForFetch()
 * takes its no-DNS-lookup fast path — the only thing under test here is
 * safeFetch()'s own fetch/redirect/timeout/size-cap mechanics, mocked at
 * the global `fetch` level, never a real network call.
 */

function mockResponse(status: number, headers: Record<string, string> = {}, body = ''): Response {
  return new Response(body, { status, headers: new Headers(headers) })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('safeFetch() — redirects', () => {
  it('follows a redirect and records the chain, excluding the final URL', async () => {
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1
        if (call === 1) return mockResponse(301, { location: 'http://8.8.8.8/next' })
        return mockResponse(200, { 'content-type': 'text/html' }, '<html>ok</html>')
      })
    )
    const result = await safeFetch('http://8.8.8.8/')
    expect(result.redirectChain).toEqual(['http://8.8.8.8/'])
    expect(result.status).toBe(200)
    expect(result.body).toBe('<html>ok</html>')
  })

  it('throws after exceeding maxRedirects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(302, { location: 'http://8.8.8.8/loop' }))
    )
    await expect(safeFetch('http://8.8.8.8/', { maxRedirects: 1 })).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' })
  })
})

describe('safeFetch() — timing and headers', () => {
  it('reports a numeric responseTimeMs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(200, { 'content-type': 'text/html' }, 'hi'))
    )
    const result = await safeFetch('http://8.8.8.8/')
    expect(typeof result.responseTimeMs).toBe('number')
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('exposes the final response headers as a plain object', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(200, { 'content-type': 'text/html', 'x-test-header': 'yes' }, 'hi'))
    )
    const result = await safeFetch('http://8.8.8.8/')
    expect(result.headers['x-test-header']).toBe('yes')
  })
})

describe('safeFetch() — response size cap (oversized responses)', () => {
  it('truncates a response larger than maxResponseBytes and marks truncated', async () => {
    const bigBody = 'a'.repeat(1000)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(200, { 'content-type': 'text/html' }, bigBody))
    )
    const result = await safeFetch('http://8.8.8.8/', { maxResponseBytes: 100 })
    expect(result.truncated).toBe(true)
    expect(result.body.length).toBeLessThanOrEqual(100)
  })

  it('does not truncate a response within the cap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(200, { 'content-type': 'text/html' }, 'small'))
    )
    const result = await safeFetch('http://8.8.8.8/', { maxResponseBytes: 100 })
    expect(result.truncated).toBe(false)
    expect(result.body).toBe('small')
  })
})

describe('safeFetch() — HEAD requests', () => {
  it('a HEAD request never reads or returns a body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(200, {}, 'this should never be read'))
    )
    const result = await safeFetch('http://8.8.8.8/', { method: 'HEAD' })
    expect(result.body).toBe('')
    expect(result.status).toBe(200)
  })
})

describe('safeFetch() — timeout', () => {
  it('throws a TIMEOUT ToolError when the request is aborted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: unknown, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted')
              err.name = 'AbortError'
              reject(err)
            })
          })
      )
    )
    await expect(safeFetch('http://8.8.8.8/', { timeoutMs: 20 })).rejects.toMatchObject({ code: 'TIMEOUT' })
  })
})

describe('safeFetch() — unsupported content type', () => {
  it('rejects a response whose Content-Type is not in allowedContentTypePrefixes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockResponse(200, { 'content-type': 'application/pdf' }, 'not html'))
    )
    await expect(safeFetch('http://8.8.8.8/', { allowedContentTypePrefixes: ['text/html'] })).rejects.toMatchObject({ code: 'UNSUPPORTED_CONTENT_TYPE' })
  })
})
