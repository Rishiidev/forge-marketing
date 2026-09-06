import { describe, expect, it } from 'vitest'
import { extractSecurityHeaders, buildSecurityHeadersFindings } from '../security-headers'

describe('extractSecurityHeaders() — "do not call a site insecure merely because one header is missing"', () => {
  it('every checked header is unavailable/missing when the response sends none', () => {
    const evidence = extractSecurityHeaders({})
    expect(evidence.present['strict-transport-security']).toBe(false)
    expect(evidence.present['content-security-policy']).toBe(false)
    expect(evidence.present['x-content-type-options']).toBe(false)
    expect(evidence.present['referrer-policy']).toBe(false)
    expect(evidence.present['permissions-policy']).toBe(false)
  })

  it('detects a present header regardless of case in the source map', () => {
    const evidence = extractSecurityHeaders({ 'X-Content-Type-Options': 'nosniff' })
    expect(evidence.present['x-content-type-options']).toBe(true)
    expect(evidence.values['x-content-type-options']).toBe('nosniff')
  })

  it('one present header does not affect another missing one', () => {
    const evidence = extractSecurityHeaders({ 'strict-transport-security': 'max-age=63072000' })
    expect(evidence.present['strict-transport-security']).toBe(true)
    expect(evidence.present['content-security-policy']).toBe(false)
  })
})

describe('buildSecurityHeadersFindings() — no rolled-up "insecure" verdict', () => {
  it('produces exactly one independent finding per checked header, never a combined verdict', () => {
    const findings = buildSecurityHeadersFindings(extractSecurityHeaders({}))
    expect(findings).toHaveLength(5)
    expect(findings.every((f) => f.severity === 'info')).toBe(true) // missing = 'info', never 'critical'
    expect(findings.some((f) => f.id.includes('insecure'))).toBe(false)
  })

  it('a present header reads as good', () => {
    const findings = buildSecurityHeadersFindings(extractSecurityHeaders({ 'referrer-policy': 'strict-origin-when-cross-origin' }))
    expect(findings.find((f) => f.id === 'security-header-referrer-policy')!.severity).toBe('good')
  })
})
