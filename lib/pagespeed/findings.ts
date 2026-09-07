import type { Finding } from '@/lib/website-analyzer/types'
import { RATING_LABEL } from './thresholds'
import type { PageSpeedAnalysis, PageSpeedCategoryScore, PageSpeedCoreWebVitals, PageSpeedFieldResult, PageSpeedLabResult, PageSpeedMetricValue, PageSpeedOpportunity, PageSpeedRating } from './provider'

/**
 * Turns a normalized `PageSpeedAnalysis` into the same `Finding[]` shape
 * every other check module in this platform produces
 * (lib/website-analyzer/types.ts) — the "Good"/"Needs attention"/
 * "Priority" labels (docs/tool-architecture.md's task brief) map
 * directly onto `RATING_LABEL`, and severity onto the same
 * good/info/warning/critical vocabulary the rest of the engine uses, so
 * nothing downstream needs to know these findings came from Google
 * rather than Forge's own analysis.
 *
 * CRITICAL, per the standing instruction: never fabricate a value
 * Google didn't actually supply. Every builder below only runs when the
 * underlying metric genuinely exists; the 'unavailable' path is always
 * an explicit, honest finding of its own, never an omission.
 */

const SEVERITY_FOR_RATING: Record<PageSpeedRating, Finding['severity']> = {
  good: 'good',
  'needs-improvement': 'warning',
  poor: 'critical',
}

const METRIC_LABEL = { lcp: 'Largest Contentful Paint', cls: 'Cumulative Layout Shift', inp: 'Interaction to Next Paint', fcp: 'First Contentful Paint', ttfb: 'Time to First Byte' } as const
const METRIC_EXPLAINER: Record<keyof typeof METRIC_LABEL, string> = {
  lcp: 'How long it takes the largest visible element (usually a hero image or heading) to finish loading — a slow one feels like the page is stuck.',
  cls: "How much visible content jumps around while the page loads — a high score means buttons and text move right as a visitor tries to tap or read them.",
  inp: 'How responsive the page feels when a visitor actually clicks, taps, or types — a slow one feels laggy or unresponsive.',
  fcp: 'How long until the first piece of content appears at all — a slow one feels like a blank, broken page.',
  ttfb: 'How long your server takes to start responding, before the browser has anything to work with at all — everything else on this list waits on this first.',
}

function categoryScoreFinding(id: string, title: string, score: PageSpeedCategoryScore | undefined): Finding {
  if (!score) {
    return {
      id,
      category: id.includes('accessibility') ? 'accessibility' : id.includes('best-practices') ? 'best-practices' : 'performance',
      severity: 'info',
      title,
      whatWeFound: `Google didn't return a ${title.toLowerCase()} score for this run.`,
      whyItMatters: 'Without a score, this category could not be checked this time.',
      recommendedAction: 'Try running this check again.',
      evidence: {},
      confidence: 'unavailable',
      status: 'ERROR',
      dataOrigin: 'unavailable',
    }
  }

  const label = RATING_LABEL[score.rating]
  return {
    id,
    category: id.includes('accessibility') ? 'accessibility' : id.includes('best-practices') ? 'best-practices' : 'performance',
    severity: SEVERITY_FOR_RATING[score.rating],
    title,
    whatWeFound: `${title} score: ${score.score}/100 — ${label}.`,
    whyItMatters:
      title === 'Performance'
        ? 'This is Lighthouse\'s overall lab score for how fast this page loads and becomes usable — not a ranking signal by itself, but a strong proxy for what a visitor actually experiences.'
        : title === 'Accessibility'
          ? 'A lower score means real visitors — including people using screen readers or keyboard navigation — are more likely to hit something that doesn\'t work for them.'
          : 'Covers general web-development best practices (image formats, browser console errors, and similar) — a lower score usually points to specific, fixable issues.',
    recommendedAction: score.rating === 'good' ? 'Nothing urgent here.' : 'See the specific opportunities and diagnostics below for exactly what to fix.',
    evidence: { score: score.score, rating: score.rating },
    confidence: 'verified',
    status: score.rating === 'good' ? 'PASS' : 'PARTIAL',
    dataOrigin: 'lab',
  }
}

function cwvFinding(metric: keyof typeof METRIC_LABEL, lab?: PageSpeedMetricValue, field?: PageSpeedMetricValue, fieldScope?: 'page' | 'origin'): Finding {
  const label = METRIC_LABEL[metric]
  const id = `pagespeed-cwv-${metric}`

  if (field) {
    const scopeNote = fieldScope === 'origin' ? ' (based on your whole site\'s real-user data — Google didn\'t have enough traffic on this exact page alone)' : ''
    return {
      id,
      category: 'performance',
      severity: SEVERITY_FOR_RATING[field.rating],
      title: label,
      whatWeFound: `Real visitors experience ${field.displayValue}${scopeNote} — ${RATING_LABEL[field.rating]}.`,
      whyItMatters: METRIC_EXPLAINER[metric],
      recommendedAction: field.rating === 'good' ? 'Nothing to do here.' : 'This is measured from real visitors, not a simulation — worth prioritizing over the lab-only metrics below.',
      evidence: { source: 'field (real users)', scope: fieldScope ?? 'page', value: field.value, displayValue: field.displayValue },
      confidence: 'verified',
      status: field.rating === 'good' ? 'PASS' : 'PARTIAL',
      dataOrigin: 'field',
    }
  }

  if (lab) {
    return {
      id,
      category: 'performance',
      severity: SEVERITY_FOR_RATING[lab.rating],
      title: label,
      whatWeFound: `A simulated test measured ${lab.displayValue} — ${RATING_LABEL[lab.rating]}. Google didn't have enough real-visitor data to measure this one directly.`,
      whyItMatters: METRIC_EXPLAINER[metric],
      recommendedAction: lab.rating === 'good' ? 'Nothing to do here.' : 'This is a lab estimate, not real-user data — treat it as directional.',
      evidence: { source: 'lab (simulated)', value: lab.value, displayValue: lab.displayValue },
      confidence: 'verified',
      status: lab.rating === 'good' ? 'PASS' : 'PARTIAL',
      dataOrigin: 'lab',
    }
  }

  return {
    id,
    category: 'performance',
    severity: 'info',
    title: label,
    whatWeFound: `Google couldn't measure ${label.toLowerCase()} for this page — ${metric === 'inp' ? 'this specific metric needs real visitor interactions, which a one-time check can\'t simulate, and there wasn\'t enough real-user data to report on either' : 'there wasn\'t enough data from this run or from real visitors'}.`,
    whyItMatters: METRIC_EXPLAINER[metric],
    recommendedAction: 'Nothing to act on from this check alone — this genuinely isn\'t available, not a bad result.',
    evidence: {},
    confidence: 'unavailable',
    status: 'NOT_APPLICABLE',
    dataOrigin: 'unavailable',
  }
}

function opportunityFinding(prefix: 'opportunity' | 'diagnostic', item: PageSpeedOpportunity): Finding {
  const savingsNote = item.estimatedSavingsMs ? ` Google estimates fixing this could save about ${(item.estimatedSavingsMs / 1000).toFixed(1)}s.` : ''
  return {
    id: `pagespeed-${prefix}-${item.id}`,
    category: 'performance',
    severity: prefix === 'opportunity' ? 'warning' : 'info',
    title: item.title,
    whatWeFound: `${item.description || item.title}${savingsNote}`,
    whyItMatters: prefix === 'opportunity' ? 'This is one of the specific things Lighthouse found that is actually slowing this page down.' : 'A smaller diagnostic signal worth being aware of, not necessarily a top priority.',
    recommendedAction: prefix === 'opportunity' ? 'Worth fixing — this is a concrete, estimated speed improvement.' : 'Optional — review if you have time.',
    evidence: item.estimatedSavingsMs ? { estimatedSavingsMs: item.estimatedSavingsMs } : {},
    confidence: 'verified',
    status: 'FOUND',
    dataOrigin: 'lab',
  }
}

function unavailableReasonText(reason: string): string {
  if (reason === 'not-configured') return "Live PageSpeed data isn't enabled for this tool right now."
  if (reason === 'invalid-url') return "We couldn't validate this URL for a live PageSpeed check."
  if (reason === 'quota-exceeded') return "We've hit today's limit for live PageSpeed checks — try again later."
  if (reason === 'timeout') return "Google's PageSpeed check took too long to respond."
  if (reason === 'network-error') return "We couldn't reach Google's PageSpeed service."
  return "Google's PageSpeed service returned something unexpected."
}

/** The whole-analysis-unavailable path — one honest finding per metric/category slot, never silently empty. "Return a truthful partial state," not nothing. */
export function buildUnavailableFindings(reason: string): Finding[] {
  const message = unavailableReasonText(reason)
  const base = {
    whatWeFound: message,
    whyItMatters: 'Live PageSpeed data comes from Google — when it\'s unavailable, this section can\'t show real numbers, but the SEO/technical checks below still work independently.',
    recommendedAction: 'Try running this check again in a moment.',
    evidence: { reason },
    confidence: 'unavailable' as const,
    status: 'ERROR' as const,
    dataOrigin: 'unavailable' as const,
    severity: 'info' as const,
  }

  return [
    { id: 'pagespeed-score-performance', category: 'performance', title: 'Performance score', ...base },
    { id: 'pagespeed-score-accessibility', category: 'accessibility', title: 'Accessibility score', ...base },
    { id: 'pagespeed-score-best-practices', category: 'best-practices', title: 'Best practices score', ...base },
    ...(['lcp', 'cls', 'inp', 'fcp', 'ttfb'] as const).map((metric) => ({ id: `pagespeed-cwv-${metric}`, category: 'performance' as const, title: METRIC_LABEL[metric], ...base })),
  ]
}

export function buildPageSpeedFindings(analysis: PageSpeedAnalysis): Finding[] {
  if (analysis.status === 'unavailable') return buildUnavailableFindings(analysis.reason)

  const { lab, field } = analysis
  const findings: Finding[] = []

  findings.push(categoryScoreFinding('pagespeed-score-performance', 'Performance', lab.categories.performance))
  findings.push(categoryScoreFinding('pagespeed-score-accessibility', 'Accessibility', lab.categories.accessibility))
  findings.push(categoryScoreFinding('pagespeed-score-best-practices', 'Best practices', lab.categories.bestPractices))

  const metricKeys = ['lcp', 'cls', 'inp', 'fcp', 'ttfb'] as const
  for (const metric of metricKeys) {
    findings.push(cwvFinding(metric, lab.coreWebVitals[metric], field?.coreWebVitals[metric], field?.scope))
  }

  for (const opportunity of lab.opportunities) findings.push(opportunityFinding('opportunity', opportunity))
  for (const diagnostic of lab.diagnostics) findings.push(opportunityFinding('diagnostic', diagnostic))

  return findings
}

export type { PageSpeedCoreWebVitals, PageSpeedFieldResult, PageSpeedLabResult }
