import { describe, expect, it } from 'vitest'
import { normalizeGoogleResponse } from '../normalizer'

function baseLighthouseResult(overrides: Record<string, unknown> = {}) {
  return {
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 0.92 },
      'best-practices': { score: 1 },
    },
    audits: {
      'largest-contentful-paint': { numericValue: 2400, displayValue: '2.4 s', score: 0.8 },
      'cumulative-layout-shift': { numericValue: 0.02, displayValue: '0.02', score: 1 },
      'first-contentful-paint': { numericValue: 1200, displayValue: '1.2 s', score: 0.9 },
      'server-response-time': { numericValue: 320, displayValue: '320 ms', score: 0.9 },
    },
    ...overrides,
  }
}

describe('normalizeGoogleResponse() — malformed / missing input', () => {
  it('returns unavailable/invalid-response for a non-object payload', () => {
    expect(normalizeGoogleResponse(null, 'mobile')).toEqual({ status: 'unavailable', reason: 'invalid-response' })
    expect(normalizeGoogleResponse('not json', 'mobile')).toEqual({ status: 'unavailable', reason: 'invalid-response' })
  })

  it('returns unavailable/invalid-response when lighthouseResult is missing entirely', () => {
    expect(normalizeGoogleResponse({}, 'mobile')).toEqual({ status: 'unavailable', reason: 'invalid-response' })
  })

  it('does not throw on a garbled/partial lighthouseResult', () => {
    expect(() => normalizeGoogleResponse({ lighthouseResult: { audits: 'not an object' } }, 'mobile')).not.toThrow()
  })
})

describe('normalizeGoogleResponse() — lab data', () => {
  it('extracts LCP/CLS/FCP/TTFB from lab audits, correctly rated', () => {
    const result = normalizeGoogleResponse({ lighthouseResult: baseLighthouseResult() }, 'mobile')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.lab.coreWebVitals.lcp).toMatchObject({ value: 2400, rating: 'good' })
    expect(result.lab.coreWebVitals.cls).toMatchObject({ value: 0.02, rating: 'good' })
    expect(result.lab.coreWebVitals.fcp).toMatchObject({ value: 1200, rating: 'good' })
    expect(result.lab.coreWebVitals.ttfb).toMatchObject({ value: 320, rating: 'good' })
  })

  it('never produces a lab INP value — Lighthouse has no real lab measurement for it', () => {
    const result = normalizeGoogleResponse({ lighthouseResult: baseLighthouseResult() }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.lab.coreWebVitals.inp).toBeUndefined()
  })

  it('converts a 0-1 category score to 0-100 and rates it', () => {
    const result = normalizeGoogleResponse({ lighthouseResult: baseLighthouseResult() }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.lab.categories.performance).toEqual({ score: 85, rating: 'needs-improvement' })
    expect(result.lab.categories.bestPractices).toEqual({ score: 100, rating: 'good' })
  })

  it('a missing audit for a metric leaves it undefined, never fabricated', () => {
    const lighthouseResult = baseLighthouseResult()
    delete (lighthouseResult.audits as Record<string, unknown>)['largest-contentful-paint']
    const result = normalizeGoogleResponse({ lighthouseResult }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.lab.coreWebVitals.lcp).toBeUndefined()
  })
})

describe('normalizeGoogleResponse() — field data (CrUX)', () => {
  const fieldMetrics = {
    LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2600, category: 'AVERAGE' },
    CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 5, category: 'GOOD' }, // documented CrUX quirk: score * 100
    INTERACTION_TO_NEXT_PAINT: { percentile: 180, category: 'GOOD' },
    FIRST_CONTENTFUL_PAINT_MS: { percentile: 1400, category: 'GOOD' },
    EXPERIMENTAL_TIME_TO_FIRST_BYTE: { percentile: 600, category: 'GOOD' },
  }

  it('extracts page-level field data when loadingExperience is present', () => {
    const result = normalizeGoogleResponse(
      { lighthouseResult: baseLighthouseResult(), loadingExperience: { metrics: fieldMetrics, overall_category: 'FAST' } },
      'mobile'
    )
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.field?.scope).toBe('page')
    expect(result.field?.coreWebVitals.inp).toMatchObject({ value: 180, rating: 'good' })
    // CLS percentile 5 -> real score 0.05, divided by the documented *100 scale.
    expect(result.field?.coreWebVitals.cls?.value).toBeCloseTo(0.05)
    expect(result.field?.overallRating).toBe('good')
  })

  it('falls back to origin-level field data when loadingExperience is absent, and marks scope "origin"', () => {
    const result = normalizeGoogleResponse(
      { lighthouseResult: baseLighthouseResult(), originLoadingExperience: { metrics: fieldMetrics, overall_category: 'AVERAGE' } },
      'mobile'
    )
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.field?.scope).toBe('origin')
    expect(result.field?.overallRating).toBe('needs-improvement')
  })

  it('field is null — not fabricated as zeros — when Google has no field data at all', () => {
    const result = normalizeGoogleResponse({ lighthouseResult: baseLighthouseResult() }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.field).toBeNull()
  })

  it('field is null when loadingExperience exists but has no metrics at all', () => {
    const result = normalizeGoogleResponse({ lighthouseResult: baseLighthouseResult(), loadingExperience: { id: 'x' } }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.field).toBeNull()
  })
})

describe('normalizeGoogleResponse() — opportunities and diagnostics', () => {
  it('extracts opportunity-type audits, sorted by estimated savings, capped at 5', () => {
    const lighthouseResult = baseLighthouseResult({
      audits: {
        ...baseLighthouseResult().audits,
        'render-blocking-resources': { title: 'Eliminate render-blocking resources', description: 'x', score: 0.5, details: { type: 'opportunity', overallSavingsMs: 450 } },
        'unused-css-rules': { title: 'Reduce unused CSS', description: 'y', score: 0.6, details: { type: 'opportunity', overallSavingsMs: 900 } },
        'not-an-opportunity': { title: 'Some other audit', description: 'z', score: 0.5, details: { type: 'table' } },
      },
    })
    const result = normalizeGoogleResponse({ lighthouseResult }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.lab.opportunities.map((o) => o.id)).toEqual(['unused-css-rules', 'render-blocking-resources'])
    expect(result.lab.opportunities.every((o) => (o.estimatedSavingsMs ?? 0) > 0)).toBe(true)
  })

  it('extracts diagnostics-group audits from categories.performance.auditRefs, excluding passing ones', () => {
    const lighthouseResult = baseLighthouseResult({
      categories: {
        ...baseLighthouseResult().categories,
        performance: {
          score: 0.85,
          auditRefs: [
            { id: 'uses-passive-event-listeners', group: 'diagnostics' },
            { id: 'dom-size', group: 'diagnostics' },
            { id: 'largest-contentful-paint', group: 'metrics' },
          ],
        },
      },
      audits: {
        ...baseLighthouseResult().audits,
        'uses-passive-event-listeners': { title: 'Use passive listeners', description: 'x', score: 0.5 },
        'dom-size': { title: 'Avoid an excessive DOM size', description: 'y', score: 1 },
      },
    })
    const result = normalizeGoogleResponse({ lighthouseResult }, 'mobile')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.lab.diagnostics.map((d) => d.id)).toEqual(['uses-passive-event-listeners'])
  })
})
