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
 * events only — the CRM-lifecycle events in that table (audit_completed,
 * qualified, contacted, etc.) are backend-triggered and belong to
 * lib/crm.ts's trackLeadEvent(), not here.
 *
 * Not every event below is wired to a real call site yet — pricing_viewed
 * and showcase_viewed in particular are defined for pages that use a
 * scroll-observer or per-visit tracking later; adding that observer
 * everywhere isn't done in this pass (see "avoid unnecessary client-side
 * JavaScript" in the homepage build brief). Wire them when a real need
 * arises rather than adding an observer speculatively.
 */
export type AnalyticsEvent =
  | { name: 'audit_started'; props: { source: string } }
  | { name: 'lead_submitted'; props: { source: string; leadId?: string } }
  | { name: 'lead_submit_error'; props: { source: string; error?: string } }
  | { name: 'website_cta_clicked'; props: { location: string } }
  | { name: 'whatsapp_clicked'; props: { location: string } }
  | { name: 'pricing_viewed'; props: { tier?: string } }
  | { name: 'showcase_viewed'; props: { slug: string } }
  | { name: 'maintenance_plan_viewed'; props: Record<string, never> }
  | { name: 'tool_used'; props: { slug: string } }
  | { name: 'blog_viewed'; props: { slug: string } }

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
