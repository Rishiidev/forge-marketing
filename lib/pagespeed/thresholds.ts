import type { PageSpeedRating } from './provider'

/**
 * Every threshold here is Google's own published number, not Forge's
 * judgment call — verified directly against web.dev on 2026-09-07
 * (see lib/pagespeed/provider.ts's doc comment for the full citation
 * list). Central so the rest of this module never repeats a magic
 * number that could drift from what's actually documented.
 *
 * - LCP good ≤2.5s / poor >4.0s — web.dev/articles/lcp: "sites should
 *   strive to have Largest Contentful Paint of 2.5 seconds or less" /
 *   "greater than 4.0 seconds."
 * - CLS good ≤0.1 / poor >0.25 — the stable, unchanged CLS thresholds
 *   Google has published since CLS became a Core Web Vital.
 * - INP good ≤200ms / poor >500ms — web.dev/articles/inp: "below or at
 *   200 milliseconds" / "above 500 milliseconds."
 * - FCP good ≤1.8s / poor >3.0s — the stable, unchanged FCP thresholds
 *   Google has published since FCP was added to Lighthouse/CrUX.
 * - TTFB good ≤0.8s / poor >1.8s — web.dev/articles/ttfb: "0.8 seconds
 *   or less" / "greater than 1.8 seconds."
 */
export const METRIC_THRESHOLDS_MS = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 }, // unitless, not milliseconds — same field for convenience
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
} as const

export function rateMetric(metric: keyof typeof METRIC_THRESHOLDS_MS, value: number): PageSpeedRating {
  const { good, poor } = METRIC_THRESHOLDS_MS[metric]
  if (value <= good) return 'good'
  if (value > poor) return 'poor'
  return 'needs-improvement'
}

/**
 * Lighthouse's own official score-color convention (unchanged for
 * years, used identically on the real PageSpeed Insights website):
 * 0-49 red/poor, 50-89 orange/needs-improvement, 90-100 green/good.
 */
export function rateCategoryScore(score0to100: number): PageSpeedRating {
  if (score0to100 >= 90) return 'good'
  if (score0to100 < 50) return 'poor'
  return 'needs-improvement'
}

/** Task-facing labels — "Good"/"Needs attention"/"Priority" — distinct from the internal `PageSpeedRating` union so the exact copy lives in one place. */
export const RATING_LABEL: Record<PageSpeedRating, string> = {
  good: 'Good',
  'needs-improvement': 'Needs attention',
  poor: 'Priority',
}
