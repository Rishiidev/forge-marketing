import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchRobotsTxt, buildRobotsFindings } from '../robots'
import { fetchSitemap, buildSitemapFindings } from '../sitemap'

// vi.mock calls are hoisted above these imports by vitest's transform,
// so both lib/website-analyzer/robots.ts and sitemap.ts (each importing
// safeFetch from '../security') pick up this mock instead of ever
// touching the network or node:dns.
const safeFetchMock = vi.fn()

vi.mock('../security', () => ({
  safeFetch: (...args: unknown[]) => safeFetchMock(...args),
  AUXILIARY_FETCH_OPTIONS: {},
}))

beforeEach(() => {
  safeFetchMock.mockReset()
})

describe('fetchRobotsTxt() — failed robots.txt', () => {
  it('a thrown fetch (timeout/SSRF/unreachable) is reported as fetchFailed, not "does not exist"', async () => {
    safeFetchMock.mockRejectedValueOnce(new Error('boom'))
    const evidence = await fetchRobotsTxt('https://example.com')
    expect(evidence.fetchFailed).toBe(true)
    expect(evidence.exists).toBe(false)

    const findings = buildRobotsFindings(evidence)
    expect(findings[0]!.status).toBe('ERROR')
    expect(findings[0]!.confidence).toBe('unavailable')
  })

  it('a clean 404 is reported as "does not exist," not a failure', async () => {
    safeFetchMock.mockResolvedValueOnce({ status: 404, body: '', redirectChain: [], responseTimeMs: 10, contentType: '', truncated: false, headers: {}, finalUrl: 'https://example.com/robots.txt' })
    const evidence = await fetchRobotsTxt('https://example.com')
    expect(evidence.exists).toBe(false)
    expect(evidence.fetchFailed).toBe(false)
    expect(buildRobotsFindings(evidence)[0]!.status).toBe('NOT_FOUND')
  })

  it('a real robots.txt with a sitemap declaration is parsed correctly', async () => {
    safeFetchMock.mockResolvedValueOnce({
      status: 200,
      body: 'User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml',
      redirectChain: [],
      responseTimeMs: 10,
      contentType: 'text/plain',
      truncated: false,
      headers: {},
      finalUrl: 'https://example.com/robots.txt',
    })
    const evidence = await fetchRobotsTxt('https://example.com')
    expect(evidence.exists).toBe(true)
    expect(evidence.accessible).toBe(true)
    expect(evidence.hasUserAgentLine).toBe(true)
    expect(evidence.sitemapDeclarations).toEqual(['https://example.com/sitemap.xml'])
  })

  it('a non-2xx, non-404 status is "exists but not accessible"', async () => {
    safeFetchMock.mockResolvedValueOnce({ status: 500, body: '', redirectChain: [], responseTimeMs: 10, contentType: '', truncated: false, headers: {}, finalUrl: 'https://example.com/robots.txt' })
    const evidence = await fetchRobotsTxt('https://example.com')
    expect(evidence.exists).toBe(true)
    expect(evidence.accessible).toBe(false)
  })
})

describe('fetchSitemap() — failed sitemap', () => {
  it('a thrown fetch is reported as fetchFailed', async () => {
    safeFetchMock.mockRejectedValueOnce(new Error('boom'))
    const evidence = await fetchSitemap('https://example.com')
    expect(evidence.fetchFailed).toBe(true)
    const findings = buildSitemapFindings(evidence)
    expect(findings[0]!.status).toBe('ERROR')
  })

  it('a clean 404 is reported as "does not exist"', async () => {
    safeFetchMock.mockResolvedValueOnce({ status: 404, body: '', redirectChain: [], responseTimeMs: 10, contentType: '', truncated: false, headers: {}, finalUrl: 'https://example.com/sitemap.xml' })
    const evidence = await fetchSitemap('https://example.com')
    expect(evidence.exists).toBe(false)
    expect(buildSitemapFindings(evidence)[0]!.status).toBe('NOT_FOUND')
  })

  it('a real urlset sitemap counts its <url> entries without following any of them', async () => {
    safeFetchMock.mockResolvedValueOnce({
      status: 200,
      body: '<?xml version="1.0"?><urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/about</loc></url></urlset>',
      redirectChain: [],
      responseTimeMs: 10,
      contentType: 'application/xml',
      truncated: false,
      headers: {},
      finalUrl: 'https://example.com/sitemap.xml',
    })
    const evidence = await fetchSitemap('https://example.com')
    expect(evidence.isSitemapIndex).toBe(false)
    expect(evidence.entryCount).toBe(2)
    // Only one fetch happened — the child URLs were counted, never fetched.
    expect(safeFetchMock).toHaveBeenCalledTimes(1)
  })

  it('a sitemap index counts child sitemaps, never fetching them', async () => {
    safeFetchMock.mockResolvedValueOnce({
      status: 200,
      body: '<?xml version="1.0"?><sitemapindex><sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap></sitemapindex>',
      redirectChain: [],
      responseTimeMs: 10,
      contentType: 'application/xml',
      truncated: false,
      headers: {},
      finalUrl: 'https://example.com/sitemap.xml',
    })
    const evidence = await fetchSitemap('https://example.com')
    expect(evidence.isSitemapIndex).toBe(true)
    expect(evidence.entryCount).toBe(1)
    expect(safeFetchMock).toHaveBeenCalledTimes(1)
  })
})
