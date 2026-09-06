import { describe, expect, it } from 'vitest'
import { buildHttpFindings, type HttpEvidence } from '../fetcher'

function evidence(overrides: Partial<HttpEvidence> = {}): HttpEvidence {
  return {
    status: 200,
    finalUrl: 'https://example.com/',
    requestedUrl: 'https://example.com/',
    redirectChain: [],
    responseTimeMs: 200,
    contentType: 'text/html',
    https: true,
    headers: {},
    body: '<html></html>',
    truncated: false,
    ...overrides,
  }
}

describe('buildHttpFindings()', () => {
  it('a healthy 200 HTTPS response reads as good with no redirect finding', () => {
    const findings = buildHttpFindings(evidence())
    expect(findings.find((f) => f.id === 'http-status')!.severity).toBe('good')
    expect(findings.find((f) => f.id === 'http-https')!.severity).toBe('good')
    expect(findings.some((f) => f.id === 'http-redirects')).toBe(false)
  })

  it('a non-2xx status is critical', () => {
    const findings = buildHttpFindings(evidence({ status: 500 }))
    expect(findings.find((f) => f.id === 'http-status')!.severity).toBe('critical')
    expect(findings.find((f) => f.id === 'http-status')!.status).toBe('FAIL')
  })

  it('a non-HTTPS final URL is critical', () => {
    const findings = buildHttpFindings(evidence({ https: false, finalUrl: 'http://example.com/' }))
    expect(findings.find((f) => f.id === 'http-https')!.severity).toBe('critical')
  })

  it('a redirect chain produces its own finding, escalating with more hops', () => {
    const oneHop = buildHttpFindings(evidence({ redirectChain: ['https://example.com/'] }))
    expect(oneHop.find((f) => f.id === 'http-redirects')!.severity).toBe('info')

    const manyHops = buildHttpFindings(evidence({ redirectChain: ['a', 'b', 'c'] }))
    expect(manyHops.find((f) => f.id === 'http-redirects')!.severity).toBe('warning')
  })

  it('a slow response time is flagged', () => {
    const findings = buildHttpFindings(evidence({ responseTimeMs: 5000 }))
    expect(findings.find((f) => f.id === 'http-response-time')!.severity).toBe('warning')
  })

  it('every http finding is verified confidence — this category is always directly observed, never estimated', () => {
    for (const f of buildHttpFindings(evidence({ redirectChain: ['x'] }))) {
      expect(f.confidence).toBe('verified')
    }
  })
})
