import { describe, expect, it } from 'vitest'
import { buildPageSpeedFindings } from '../findings'
import type { PageSpeedAnalysis } from '../provider'

describe('buildPageSpeedFindings() — unavailable analysis returns a truthful partial state', () => {
  it('produces an honest, explicit finding for every score/metric slot — never zero findings, never a fabricated number', () => {
    const analysis: PageSpeedAnalysis = { status: 'unavailable', reason: 'quota-exceeded' }
    const findings = buildPageSpeedFindings(analysis)

    expect(findings.length).toBe(8) // 3 category scores + 5 Core Web Vitals
    expect(findings.every((f) => f.dataOrigin === 'unavailable')).toBe(true)
    expect(findings.every((f) => f.confidence === 'unavailable')).toBe(true)
    expect(findings.every((f) => Object.keys(f.evidence).length === 0 || f.evidence.reason === 'quota-exceeded')).toBe(true)
  })

  it('the unavailable reason is reflected in plain language, not just the raw code', () => {
    const findings = buildPageSpeedFindings({ status: 'unavailable', reason: 'not-configured' })
    expect(findings[0]!.whatWeFound.toLowerCase()).toContain('enabled')
  })
})

describe('buildPageSpeedFindings() — ok analysis: LAB vs FIELD vs UNAVAILABLE', () => {
  const okWithField: PageSpeedAnalysis = {
    status: 'ok',
    strategy: 'mobile',
    lab: {
      categories: { performance: { score: 85, rating: 'needs-improvement' } },
      coreWebVitals: {
        lcp: { value: 2400, displayValue: '2.4 s', rating: 'good' },
        // no lab cls/fcp/ttfb/inp for this fixture
      },
      opportunities: [],
      diagnostics: [],
      fetchedAt: new Date().toISOString(),
    },
    field: {
      coreWebVitals: { inp: { value: 180, displayValue: '180 ms', rating: 'good' } },
      overallRating: 'good',
      scope: 'page',
    },
  }

  it('a metric with field data present is tagged dataOrigin "field", not "lab"', () => {
    const findings = buildPageSpeedFindings(okWithField)
    const inp = findings.find((f) => f.id === 'pagespeed-cwv-inp')!
    expect(inp.dataOrigin).toBe('field')
    expect(inp.whatWeFound).toContain('Real visitors')
  })

  it('a metric with only lab data present is tagged dataOrigin "lab", and says so in plain language', () => {
    const findings = buildPageSpeedFindings(okWithField)
    const lcp = findings.find((f) => f.id === 'pagespeed-cwv-lcp')!
    expect(lcp.dataOrigin).toBe('lab')
    expect(lcp.whatWeFound.toLowerCase()).toContain('simulated')
  })

  it('a metric with neither lab nor field data is tagged "unavailable" and never invents a value', () => {
    const findings = buildPageSpeedFindings(okWithField)
    const cls = findings.find((f) => f.id === 'pagespeed-cwv-cls')!
    expect(cls.dataOrigin).toBe('unavailable')
    expect(cls.confidence).toBe('unavailable')
    expect(cls.evidence.value).toBeUndefined()
  })

  it('field data sourced from origin scope (not page-specific) says so honestly', () => {
    const originScoped: PageSpeedAnalysis = { ...okWithField, field: { ...okWithField.field!, scope: 'origin' } }
    const findings = buildPageSpeedFindings(originScoped)
    const inp = findings.find((f) => f.id === 'pagespeed-cwv-inp')!
    expect(inp.whatWeFound.toLowerCase()).toContain('whole site')
  })

  it('category scores are always dataOrigin "lab" — Lighthouse scores have no field equivalent', () => {
    const findings = buildPageSpeedFindings(okWithField)
    const perf = findings.find((f) => f.id === 'pagespeed-score-performance')!
    expect(perf.dataOrigin).toBe('lab')
  })
})

describe('buildPageSpeedFindings() — severity follows Good/Needs attention/Priority', () => {
  it('a "poor" rating maps to critical severity', () => {
    const analysis: PageSpeedAnalysis = {
      status: 'ok',
      strategy: 'mobile',
      lab: {
        categories: {},
        coreWebVitals: { lcp: { value: 5000, displayValue: '5.0 s', rating: 'poor' } },
        opportunities: [],
        diagnostics: [],
        fetchedAt: new Date().toISOString(),
      },
      field: null,
    }
    const lcp = buildPageSpeedFindings(analysis).find((f) => f.id === 'pagespeed-cwv-lcp')!
    expect(lcp.severity).toBe('critical')
  })
})
