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

export type AnalyticsEvent =
  | { name: 'lead_form_view'; props: { source: string } }
  | { name: 'lead_form_submit'; props: { source: string } }
  | { name: 'lead_form_success'; props: { source: string; leadId?: string } }
  | { name: 'lead_form_error'; props: { source: string; error?: string } }
  | { name: 'whatsapp_click'; props: { location: string } }
  | { name: 'pricing_tier_view'; props: { tier: string } }
  | { name: 'showcase_view'; props: { slug: string } }
  | { name: 'tool_view'; props: { slug: string } }
  | { name: 'blog_view'; props: { slug: string } }

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
