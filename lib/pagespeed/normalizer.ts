import { rateCategoryScore, rateMetric } from './thresholds'
import type { PageSpeedAnalysis, PageSpeedCoreWebVitals, PageSpeedFieldResult, PageSpeedLabResult, PageSpeedOpportunity, PageSpeedStrategy } from './provider'

/**
 * Turns Google's raw `runPagespeed` JSON into Forge's normalized
 * `PageSpeedAnalysis`. Every field read here is optional-chained and
 * type-guarded — a missing or wrong-typed field becomes an absent
 * metric, never a fabricated 0/NaN. This is the one place that shape of
 * defensiveness lives; lib/pagespeed/google-provider.ts calls this once
 * per real API response.
 *
 * Loosely typed on purpose (`unknown` in, defensive reads throughout) —
 * this is parsing a third party's JSON, not a shape Forge controls or
 * has a formal schema for; a real structural schema/codegen would be
 * more paid-provider infrastructure than this zero-cost project takes
 * on for one endpoint (docs/tools-cost-policy.md §B).
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

// ============================================================
// Lab data — lighthouseResult
// ============================================================

interface RawAudit {
  numericValue?: number
  displayValue?: string
  title?: string
  description?: string
  score: number | null
  details?: { type?: string; overallSavingsMs?: number }
}

function readAudit(audits: Record<string, unknown>, id: string): RawAudit | null {
  const audit = audits[id]
  if (!isRecord(audit)) return null
  return {
    numericValue: num(audit.numericValue),
    displayValue: str(audit.displayValue),
    title: str(audit.title),
    description: str(audit.description),
    score: typeof audit.score === 'number' ? audit.score : null,
    details: isRecord(audit.details) ? { type: str(audit.details.type), overallSavingsMs: num(audit.details.overallSavingsMs) } : undefined,
  }
}

function labMetric(audits: Record<string, unknown>, auditId: string, metric: 'lcp' | 'cls' | 'fcp' | 'ttfb') {
  const audit = readAudit(audits, auditId)
  const value = audit?.numericValue
  if (value === undefined) return undefined
  return { value, displayValue: audit?.displayValue ?? String(value), rating: rateMetric(metric, value) }
}

function extractLabCoreWebVitals(audits: Record<string, unknown>): PageSpeedCoreWebVitals {
  return {
    lcp: labMetric(audits, 'largest-contentful-paint', 'lcp'),
    cls: labMetric(audits, 'cumulative-layout-shift', 'cls'),
    fcp: labMetric(audits, 'first-contentful-paint', 'fcp'),
    // 'server-response-time' is Lighthouse's lab proxy for TTFB (audit
    // title: "Reduce initial server response time") — there is no audit
    // literally named "time-to-first-byte" in a standard lab run.
    ttfb: labMetric(audits, 'server-response-time', 'ttfb'),
    // Deliberately no `inp` here — see PageSpeedLabResult's doc comment
    // (lib/pagespeed/provider.ts): a lab run has no real user
    // interaction for Lighthouse to derive INP from.
  }
}

function extractCategoryScore(categories: Record<string, unknown>, id: string) {
  const category = categories[id]
  if (!isRecord(category)) return undefined
  const raw = num(category.score)
  if (raw === undefined) return undefined
  const score = Math.round(raw * 100)
  return { score, rating: rateCategoryScore(score) }
}

function extractOpportunities(audits: Record<string, unknown>): PageSpeedOpportunity[] {
  const opportunities: (PageSpeedOpportunity & { savings: number })[] = []
  for (const [id, raw] of Object.entries(audits)) {
    const audit = readAudit({ [id]: raw }, id)
    if (!audit || audit.details?.type !== 'opportunity') continue
    const savings = audit.details.overallSavingsMs
    if (!savings || savings <= 0) continue
    opportunities.push({ id, title: audit.title ?? id, description: audit.description ?? '', estimatedSavingsMs: savings, savings })
  }
  return opportunities
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5)
    .map(({ id, title, description, estimatedSavingsMs }) => ({ id, title, description, estimatedSavingsMs }))
}

/** Lighthouse audit refs tagged with group 'diagnostics' under the performance category, currently failing (score < 1) — surfaced separately from savings-estimated "opportunities." */
function extractDiagnostics(lighthouseResult: Record<string, unknown>): PageSpeedOpportunity[] {
  const categories = lighthouseResult.categories
  const audits = lighthouseResult.audits
  if (!isRecord(categories) || !isRecord(audits)) return []
  const performance = categories.performance
  if (!isRecord(performance) || !Array.isArray(performance.auditRefs)) return []

  const diagnosticIds = performance.auditRefs
    .filter((ref): ref is Record<string, unknown> => isRecord(ref) && ref.group === 'diagnostics')
    .map((ref) => str(ref.id))
    .filter((id): id is string => Boolean(id))

  const diagnostics: PageSpeedOpportunity[] = []
  for (const id of diagnosticIds) {
    const audit = readAudit(audits, id)
    if (!audit || audit.score === null || audit.score >= 1) continue
    diagnostics.push({ id, title: audit.title ?? id, description: audit.description ?? '' })
  }
  return diagnostics.slice(0, 8)
}

function normalizeLab(lighthouseResult: unknown): PageSpeedLabResult | null {
  if (!isRecord(lighthouseResult)) return null
  const categories = isRecord(lighthouseResult.categories) ? lighthouseResult.categories : {}
  const audits = isRecord(lighthouseResult.audits) ? lighthouseResult.audits : {}

  return {
    categories: {
      performance: extractCategoryScore(categories, 'performance'),
      accessibility: extractCategoryScore(categories, 'accessibility'),
      bestPractices: extractCategoryScore(categories, 'best-practices'),
    },
    coreWebVitals: extractLabCoreWebVitals(audits),
    opportunities: extractOpportunities(audits),
    diagnostics: extractDiagnostics(lighthouseResult),
    fetchedAt: new Date().toISOString(),
  }
}

// ============================================================
// Field data — loadingExperience / originLoadingExperience
// ============================================================

const FIELD_CATEGORY_MAP: Record<string, 'good' | 'needs-improvement' | 'poor'> = {
  FAST: 'good',
  AVERAGE: 'needs-improvement',
  SLOW: 'poor',
}

function fieldMetric(metrics: Record<string, unknown>, key: string, metricName: 'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb', scale = 1) {
  const entry = metrics[key]
  if (!isRecord(entry)) return undefined
  const percentile = num(entry.percentile)
  if (percentile === undefined) return undefined
  const value = percentile / scale
  return { value, displayValue: metricName === 'cls' ? value.toFixed(2) : `${(value / 1000).toFixed(1)} s`, rating: rateMetric(metricName, value) }
}

function normalizeField(loadingExperience: unknown, scope: 'page' | 'origin'): PageSpeedFieldResult | null {
  if (!isRecord(loadingExperience) || !isRecord(loadingExperience.metrics)) return null
  const metrics = loadingExperience.metrics

  const coreWebVitals: PageSpeedCoreWebVitals = {
    lcp: fieldMetric(metrics, 'LARGEST_CONTENTFUL_PAINT_MS', 'lcp'),
    // CrUX's own API has reported CLS as (score * 100) under this key
    // for years — a documented quirk, not a Forge assumption; dividing
    // back by 100 here converts the reported integer percentile back to
    // the real 0-1 CLS score before rating it against the same
    // thresholds lab CLS uses.
    cls: fieldMetric(metrics, 'CUMULATIVE_LAYOUT_SHIFT_SCORE', 'cls', 100),
    inp: fieldMetric(metrics, 'INTERACTION_TO_NEXT_PAINT', 'inp'),
    fcp: fieldMetric(metrics, 'FIRST_CONTENTFUL_PAINT_MS', 'fcp'),
    // Google's own API still labels this metric key "EXPERIMENTAL" as
    // of the docs verified for this feature (docs/tools.md) — reported
    // here exactly as Google reports it, not upgraded to non-experimental.
    ttfb: fieldMetric(metrics, 'EXPERIMENTAL_TIME_TO_FIRST_BYTE', 'ttfb'),
  }

  if (!coreWebVitals.lcp && !coreWebVitals.cls && !coreWebVitals.inp && !coreWebVitals.fcp && !coreWebVitals.ttfb) return null

  const overallCategory = str(loadingExperience.overall_category)
  return { coreWebVitals, overallRating: overallCategory ? (FIELD_CATEGORY_MAP[overallCategory] ?? null) : null, scope }
}

export function normalizeGoogleResponse(json: unknown, strategy: PageSpeedStrategy): PageSpeedAnalysis {
  if (!isRecord(json)) return { status: 'unavailable', reason: 'invalid-response' }

  const lab = normalizeLab(json.lighthouseResult)
  if (!lab) return { status: 'unavailable', reason: 'invalid-response' }

  // Prefer page-level field data; fall back to origin-level (the whole
  // site's aggregate) only when Google has no page-specific sample —
  // origin-level data describes the *site*, not necessarily this exact
  // page, so it's kept in the same `field` slot rather than invented as
  // if it were page-specific (the UI is responsible for saying which
  // scope it actually got — see lib/pagespeed/findings.ts).
  const field = normalizeField(json.loadingExperience, 'page') ?? normalizeField(json.originLoadingExperience, 'origin')

  return { status: 'ok', strategy, lab, field }
}
