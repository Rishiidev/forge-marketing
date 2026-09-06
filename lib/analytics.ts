/**
 * Analytics abstraction layer.
 *
 * IMPORTANT: legacy/privacy.html makes a live, public commitment —
 * "No advertising cookies. No third-party trackers on this site." — and
 * an independent code audit confirmed zero analytics scripts exist
 * anywhere in the legacy codebase (docs/forge-business-rules.md §21).
 *
 * Do NOT wire a real analytics provider (GA, Meta Pixel, PostHog, etc.)
 * into this file without first resolving Human Decision #12 in
 * docs/forge-business-rules.md. Doing so silently would contradict an
 * existing public privacy promise. Until that decision is made, this
 * module only logs to the console in development and is a safe no-op in
 * production.
 *
 * Client-safe: this file holds no secrets and may be imported from
 * Client Components.
 */

/**
 * Event taxonomy per docs/conversion-architecture.md §7. Client-side
 * events only — the CRM-lifecycle events in that table (qualified,
 * contacted, etc.) are backend-triggered and belong to lib/crm.ts's
 * trackLeadEvent(), not here.
 *
 * Not every event below is wired to a real call site yet — pricing_viewed
 * and showcase_viewed in particular are defined for pages that use a
 * scroll-observer or per-visit tracking later; adding that observer
 * everywhere isn't done in this pass (see "avoid unnecessary client-side
 * JavaScript" in the homepage build brief). Wire them when a real need
 * arises rather than adding an observer speculatively.
 *
 * `audit_submitted`, `audit_completed`, `audit_result_viewed`, and
 * `audit_cta_clicked` were added for the Forge Free Audit tool
 * (docs/decisions.md ADR-009). NOTE — `audit_completed`'s meaning changed
 * from how docs/conversion-architecture.md §7 originally specified it:
 * that table defined it as a **backend/CRM** event fired when a human at
 * Forge finishes and delivers a manually-written audit (i.e. Forge's
 * action, not the visitor's). The audit is no longer delivered that way —
 * it's computed instantly, client-side, from the visitor's own answers —
 * so there is no separate backend delivery step left for that definition
 * to describe. `audit_completed` here means "the client-side computation
 * finished and a result is ready to render," a client event like every
 * other one in this file. See ADR-009 for the full reasoning; the doc
 * table has been updated to match.
 */
export type AnalyticsEvent =
  | { name: 'audit_started'; props: { source: string } }
  | { name: 'audit_submitted'; props: Record<string, never> }
  | { name: 'audit_completed'; props: { topCategory: string; strongCount: number; weakCount: number; missingCount: number } }
  | { name: 'audit_result_viewed'; props: { topCategory: string } }
  | { name: 'audit_cta_clicked'; props: { destination: string } }
  | { name: 'lead_submitted'; props: { source: string; leadId?: string } }
  | { name: 'lead_submit_error'; props: { source: string; error?: string } }
  | { name: 'website_cta_clicked'; props: { location: string } }
  | { name: 'whatsapp_clicked'; props: { location: string } }
  | { name: 'pricing_viewed'; props: { tier?: string } }
  | { name: 'showcase_viewed'; props: { slug: string } }
  | { name: 'maintenance_plan_viewed'; props: Record<string, never> }
  | { name: 'blog_viewed'; props: { slug: string } }
  /**
   * The Forge Free Tools engine's own taxonomy (lib/tools/analytics.ts,
   * docs/tool-architecture.md). `tool_used` above predates this and is
   * kept as-is (no current call site) — these are what a tool built on
   * the engine actually fires, one per state-machine transition
   * (lib/tools/types.ts ToolExecutionState). Every event carries `slug`;
   * attribution (utm_ fields, landing page, referrer) is preserved by
   * lib/tools/analytics.ts's helpers, not repeated in every prop type
   * here, matching how audit_* events above don't repeat it either.
   */
  | { name: 'tool_used'; props: { slug: string } }
  | { name: 'tool_viewed'; props: { slug: string } }
  | { name: 'tool_started'; props: { slug: string } }
  | { name: 'tool_validation_failed'; props: { slug: string; errorCount: number } }
  | { name: 'tool_processing_started'; props: { slug: string } }
  | { name: 'tool_completed'; props: { slug: string; findingCount: number; cached: boolean } }
  | { name: 'tool_partial'; props: { slug: string; failedCount: number } }
  | { name: 'tool_failed'; props: { slug: string; errorCode: string } }
  | { name: 'tool_result_engaged'; props: { slug: string; findingId: string } }
  | { name: 'tool_cta_clicked'; props: { slug: string; location: string; destination: string } }

export interface AnalyticsProvider {
  name: string
  track(event: AnalyticsEvent): void
}

const consoleProvider: AnalyticsProvider = {
  name: 'console',
  track(event) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event.name, event.props)
    }
  },
}

let activeProvider: AnalyticsProvider = consoleProvider

/**
 * Swap the analytics provider at app startup. Intended to be called once,
 * from a top-level Client Component, if/when a real provider is approved.
 */
export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  activeProvider = provider
}

export function trackEvent(event: AnalyticsEvent): void {
  activeProvider.track(event)
}
