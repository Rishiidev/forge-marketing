import { trackEvent } from '@/lib/analytics'
import type { ToolAttribution } from './types'

/**
 * The tools engine's analytics taxonomy — one function per event, so a
 * tool page never constructs a trackEvent() payload by hand and risks a
 * typo'd prop shape. Every function takes `slug` first so call sites
 * read the same way regardless of which event fires next.
 *
 * Attribution (utm_source/medium/campaign/content/term, landing_page,
 * referrer) is captured once, from the URL and document at read time —
 * same source AuditLeadCaptureForm.tsx already reads inline
 * (window.location.search) — centralized here so every tool preserves
 * the same fields instead of each one re-deriving a subset.
 *
 * Client-safe: reads window/document only when called, never at module
 * scope (so this file can still be imported — though its exports only
 * make sense to call — from a server context without crashing).
 */

export function captureAttribution(): ToolAttribution {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    utmTerm: params.get('utm_term') ?? undefined,
    landingPage: window.location.pathname,
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
  }
}

export function trackToolViewed(slug: string): void {
  trackEvent({ name: 'tool_viewed', props: { slug } })
}

export function trackToolStarted(slug: string): void {
  trackEvent({ name: 'tool_started', props: { slug } })
}

export function trackToolValidationFailed(slug: string, errorCount: number): void {
  trackEvent({ name: 'tool_validation_failed', props: { slug, errorCount } })
}

export function trackToolProcessingStarted(slug: string): void {
  trackEvent({ name: 'tool_processing_started', props: { slug } })
}

export function trackToolCompleted(slug: string, findingCount: number, cached: boolean): void {
  trackEvent({ name: 'tool_completed', props: { slug, findingCount, cached } })
}

export function trackToolPartial(slug: string, failedCount: number): void {
  trackEvent({ name: 'tool_partial', props: { slug, failedCount } })
}

export function trackToolFailed(slug: string, errorCode: string): void {
  trackEvent({ name: 'tool_failed', props: { slug, errorCode } })
}

/** Fired when a visitor interacts with a specific finding (expands it, follows its recommendation link) — distinct from the CTA click below. */
export function trackToolResultEngaged(slug: string, findingId: string): void {
  trackEvent({ name: 'tool_result_engaged', props: { slug, findingId } })
}

export function trackToolCtaClicked(slug: string, location: string, destination: string): void {
  trackEvent({ name: 'tool_cta_clicked', props: { slug, location, destination } })
}
