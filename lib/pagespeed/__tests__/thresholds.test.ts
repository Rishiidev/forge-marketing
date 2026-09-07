import { describe, expect, it } from 'vitest'
import { rateMetric, rateCategoryScore, RATING_LABEL, METRIC_THRESHOLDS_MS } from '../thresholds'

describe('rateMetric() — Google\'s own published Core Web Vitals thresholds', () => {
  it('LCP: good <=2.5s, poor >4.0s', () => {
    expect(rateMetric('lcp', 2500)).toBe('good')
    expect(rateMetric('lcp', 2501)).toBe('needs-improvement')
    expect(rateMetric('lcp', 4000)).toBe('needs-improvement')
    expect(rateMetric('lcp', 4001)).toBe('poor')
  })

  it('CLS: good <=0.1, poor >0.25', () => {
    expect(rateMetric('cls', 0.1)).toBe('good')
    expect(rateMetric('cls', 0.11)).toBe('needs-improvement')
    expect(rateMetric('cls', 0.26)).toBe('poor')
  })

  it('INP: good <=200ms, poor >500ms', () => {
    expect(rateMetric('inp', 200)).toBe('good')
    expect(rateMetric('inp', 500)).toBe('needs-improvement')
    expect(rateMetric('inp', 501)).toBe('poor')
  })

  it('FCP: good <=1.8s, poor >3.0s', () => {
    expect(rateMetric('fcp', 1800)).toBe('good')
    expect(rateMetric('fcp', 3001)).toBe('poor')
  })

  it('TTFB: good <=0.8s, poor >1.8s', () => {
    expect(rateMetric('ttfb', 800)).toBe('good')
    expect(rateMetric('ttfb', 1800)).toBe('needs-improvement')
    expect(rateMetric('ttfb', 1801)).toBe('poor')
  })

  it('every threshold constant matches what the module actually rates against (no drift)', () => {
    for (const metric of Object.keys(METRIC_THRESHOLDS_MS) as (keyof typeof METRIC_THRESHOLDS_MS)[]) {
      const { good, poor } = METRIC_THRESHOLDS_MS[metric]
      expect(rateMetric(metric, good)).toBe('good')
      expect(rateMetric(metric, poor + 0.01)).toBe('poor')
    }
  })
})

describe('rateCategoryScore() — Lighthouse\'s official 0-49/50-89/90-100 convention', () => {
  it('90-100 is good', () => {
    expect(rateCategoryScore(90)).toBe('good')
    expect(rateCategoryScore(100)).toBe('good')
  })
  it('50-89 is needs-improvement', () => {
    expect(rateCategoryScore(50)).toBe('needs-improvement')
    expect(rateCategoryScore(89)).toBe('needs-improvement')
  })
  it('0-49 is poor', () => {
    expect(rateCategoryScore(0)).toBe('poor')
    expect(rateCategoryScore(49)).toBe('poor')
  })
})

describe('RATING_LABEL — the task-facing "Good"/"Needs attention"/"Priority" copy', () => {
  it('covers every rating with the exact required labels', () => {
    expect(RATING_LABEL.good).toBe('Good')
    expect(RATING_LABEL['needs-improvement']).toBe('Needs attention')
    expect(RATING_LABEL.poor).toBe('Priority')
  })
})
