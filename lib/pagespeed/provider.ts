/**
 * The PageSpeed provider adapter — the same swappable-provider pattern
 * this codebase already uses for the CRM (`lib/crm.ts` `CrmAdapter`) and
 * analytics (`lib/analytics.ts` `AnalyticsProvider`): every caller talks
 * to the shape defined here, never to Google's API directly, so a
 * provider can be replaced (or turned off) without touching a call site.
 *
 * Verified directly against the current official docs before writing
 * this (2026-09-07) — see docs/tools.md "PageSpeedProvider" for the
 * full citation list and quoted findings:
 * - developers.google.com/speed/docs/insights/v5/get-started
 *   ("Last updated 2025-08-28"): an API key is optional but "recommended
 *   for frequent, automated queries." No billing is required to use the
 *   API itself — Google does not charge for PageSpeed Insights API
 *   calls (unlike many other Google Cloud APIs). Forge still never
 *   creates or configures a Google Cloud project/billing account itself
 *   — see lib/pagespeed/google-provider.ts's own doc comment for why
 *   this integration is entirely key-gated.
 * - developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed:
 *   `category` accepts exactly `performance`, `accessibility`,
 *   `best-practices`, `seo`. Top-level response fields are `kind`, `id`,
 *   `loadingExperience`, `originLoadingExperience`, `lighthouseResult`,
 *   `analysisUTCTimestamp`, `version` (plus `captchaResult`, unused here).
 * - No documented daily/per-100-second quota number appears on either
 *   current docs page — Google Cloud Console assigns a per-project
 *   default only after a key is created, not published inline in these
 *   docs. Treated as unknown/variable, never asserted as a specific
 *   figure this document didn't actually verify.
 * - web.dev/blog/inp-cwv-march-12: "Interaction to Next Paint (INP) ...
 *   officially replaced First Input Delay (FID) [as a Core Web Vital] on
 *   March 12" 2024 — Forge's Core Web Vitals never include FID.
 *
 * Client-safe (types only) — the real network call lives in
 * lib/pagespeed/google-provider.ts, `import 'server-only'`.
 */

export type PageSpeedStrategy = 'mobile' | 'desktop'

/** Google's own three-tier convention, reused verbatim (not invented — the same "good/needs improvement/poor" split every web.dev Core Web Vital and Lighthouse score page publishes) for both category scores and Core Web Vital metrics. */
export type PageSpeedRating = 'good' | 'needs-improvement' | 'poor'

export interface PageSpeedMetricValue {
  /** Raw numeric value — milliseconds for time-based metrics, a unitless score for CLS. */
  value: number
  /** Google's own pre-formatted display string when available (e.g. "2.1 s"), otherwise derived from `value`. */
  displayValue: string
  rating: PageSpeedRating
}

export interface PageSpeedCoreWebVitals {
  lcp?: PageSpeedMetricValue
  cls?: PageSpeedMetricValue
  inp?: PageSpeedMetricValue
  fcp?: PageSpeedMetricValue
  ttfb?: PageSpeedMetricValue
}

export interface PageSpeedCategoryScore {
  /** 0-100 (Lighthouse itself reports 0-1; converted once here). */
  score: number
  rating: PageSpeedRating
}

export interface PageSpeedOpportunity {
  id: string
  title: string
  description: string
  /** Google's own estimate of potential load-time savings, in milliseconds — omitted for a diagnostic that isn't a savings-estimated "opportunity" audit. */
  estimatedSavingsMs?: number
}

export interface PageSpeedLabResult {
  categories: {
    performance?: PageSpeedCategoryScore
    accessibility?: PageSpeedCategoryScore
    bestPractices?: PageSpeedCategoryScore
  }
  /**
   * Lab (simulated single Lighthouse run) values only. Deliberately has
   * no `inp` in practice — a lab run has no real user interaction for
   * Lighthouse to measure INP from, so Lighthouse's lab report does not
   * produce one; `coreWebVitals.inp` here is expected to stay
   * `undefined`, never fabricated from a proxy metric. See
   * lib/pagespeed/normalizer's own comment for the mechanics.
   */
  coreWebVitals: PageSpeedCoreWebVitals
  /** Lighthouse "opportunity"-type audits with a real estimated saving, sorted by potential impact, highest first. */
  opportunities: PageSpeedOpportunity[]
  /** Lighthouse "diagnostics"-group audits that aren't opportunities but still flagged as needing attention. */
  diagnostics: PageSpeedOpportunity[]
  fetchedAt: string
}

export interface PageSpeedFieldResult {
  /** Real-user (Chrome UX Report) values — only the metrics Google actually had enough traffic to report; a metric absent here was checked and genuinely unavailable, never assumed equal to the lab value. */
  coreWebVitals: PageSpeedCoreWebVitals
  overallRating: PageSpeedRating | null
  /** 'page' = this exact URL had enough real-user traffic for Google to report on it directly. 'origin' = Google had no page-specific sample, so this is the whole site's aggregate instead — genuinely useful, but not a claim about this one page specifically. Never silently upgraded to look page-specific. */
  scope: 'page' | 'origin'
}

export type PageSpeedUnavailableReason =
  | 'not-configured' // no API key set — see lib/pagespeed/google-provider.ts
  | 'invalid-url'
  | 'quota-exceeded'
  | 'timeout'
  | 'network-error'
  | 'invalid-response'
  | `http-${number}`

export type PageSpeedAnalysis =
  | { status: 'unavailable'; reason: PageSpeedUnavailableReason }
  | {
      status: 'ok'
      strategy: PageSpeedStrategy
      lab: PageSpeedLabResult
      /** `null` = the request succeeded but Google genuinely has no field data for this origin yet (common for lower-traffic sites) — distinct from the whole analysis being `unavailable`. */
      field: PageSpeedFieldResult | null
    }

export interface PageSpeedProvider {
  name: string
  /** True only when this provider has everything it needs to attempt a real call (e.g. an API key is set) — checked before ever touching the network, so a misconfigured provider degrades to 'unavailable' predictably rather than failing mid-request. */
  isConfigured(): boolean
  analyze(url: string, strategy: PageSpeedStrategy): Promise<PageSpeedAnalysis>
}
