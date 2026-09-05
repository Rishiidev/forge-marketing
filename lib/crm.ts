import 'server-only'

/**
 * CRM abstraction layer.
 *
 * Nothing in this file talks to a specific vendor. It exists so the rest
 * of the app can call captureLead() / trackLeadEvent() / updateLeadStage()
 * without knowing or caring whether leads currently land in a console log,
 * a generic webhook, HubSpot, or a future custom CRM. Swap the provider by
 * setting CRM_PROVIDER (and provider-specific env vars) — no call site in
 * the app needs to change.
 *
 * Server-only: this file reads env vars and makes outbound requests, so it
 * must never be imported from a Client Component. Import it from Server
 * Actions or Route Handlers only (see app/actions.ts).
 */

export type LeadSource =
  | 'audit'
  | 'website-5000'
  | 'website-15000'
  | 'website-25000'
  | 'maintenance'
  | 'waitlist'
  | 'newsletter'

export interface Lead {
  source: LeadSource
  email: string
  name?: string
  whatsapp?: string
  business?: string
  category?: string
  googleProfileUrl?: string
  message?: string
  /** Free-form extra fields a specific form wants to pass through. */
  meta?: Record<string, string | number | boolean | null>
}

export interface CaptureLeadResult {
  ok: boolean
  leadId: string
  error?: string
}

/**
 * Sales-pipeline stages. NOTE: no stage model exists anywhere in the
 * legacy codebase (docs/forge-business-rules.md §20 — "CRM lifecycle").
 * This is a forward-looking addition for the rebuild, not a migration of
 * existing behavior, and stays unused until a real CRM decision is made
 * (Human Decision #11).
 */
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

export interface LeadEvent {
  leadId: string
  name: string
  properties?: Record<string, string | number | boolean | null>
}

export interface CrmProvider {
  name: string
  captureLead(lead: Lead): Promise<CaptureLeadResult>
  trackLeadEvent?(event: LeadEvent): Promise<void>
  updateLeadStage?(leadId: string, stage: LeadStage): Promise<void>
}

function generateLeadId(source: LeadSource): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${source.toUpperCase()}-${rand}`
}

// ---------------------------------------------------------------------
// Provider: console (default)
//
// Never fails, never sends data anywhere. Used automatically whenever no
// CRM_PROVIDER env var is set, so local development and preview
// deployments don't silently drop leads or require real credentials.
// ---------------------------------------------------------------------

const consoleProvider: CrmProvider = {
  name: 'console',
  async captureLead(lead) {
    const leadId = generateLeadId(lead.source)
    // eslint-disable-next-line no-console
    console.log('[crm:console] lead captured', { leadId, ...lead })
    return { ok: true, leadId }
  },
  async trackLeadEvent(event) {
    // eslint-disable-next-line no-console
    console.log('[crm:console] event', event)
  },
  async updateLeadStage(leadId, stage) {
    // eslint-disable-next-line no-console
    console.log('[crm:console] stage update', { leadId, stage })
  },
}

// ---------------------------------------------------------------------
// Provider: webhook
//
// The generic, documented integration path — POSTs the lead as JSON to
// CRM_WEBHOOK_URL. Works unmodified with Zapier, Make, n8n, a HubSpot
// forms-relay endpoint, or a fully custom CRM's inbound endpoint. This is
// the recommended default for a real (non-console) deployment until a
// specific vendor is chosen.
// ---------------------------------------------------------------------

function createWebhookProvider(webhookUrl: string): CrmProvider {
  return {
    name: 'webhook',
    async captureLead(lead) {
      const leadId = generateLeadId(lead.source)
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'lead.captured', leadId, lead, createdAt: new Date().toISOString() }),
        })
        if (!res.ok) {
          return { ok: false, leadId, error: `webhook responded ${res.status}` }
        }
        return { ok: true, leadId }
      } catch (err) {
        return { ok: false, leadId, error: err instanceof Error ? err.message : 'webhook request failed' }
      }
    },
    async trackLeadEvent(event) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead.event', ...event }),
      }).catch(() => undefined)
    },
    async updateLeadStage(leadId, stage) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead.stage', leadId, stage }),
      }).catch(() => undefined)
    },
  }
}

// ---------------------------------------------------------------------
// Provider: HubSpot (stub)
//
// Not implemented. Exists to show the exact shape a real integration
// would take, and to fail loudly and clearly if selected before it's
// built, rather than silently dropping leads. See docs/decisions.md.
// ---------------------------------------------------------------------

const hubspotProviderStub: CrmProvider = {
  name: 'hubspot',
  async captureLead() {
    throw new Error(
      'CRM_PROVIDER=hubspot is selected but not implemented yet. See docs/decisions.md and docs/forge-business-rules.md Human Decision #11.'
    )
  },
}

function resolveProvider(): CrmProvider {
  const selected = process.env.CRM_PROVIDER
  if (selected === 'webhook') {
    const url = process.env.CRM_WEBHOOK_URL
    if (url) return createWebhookProvider(url)
    console.warn('[crm] CRM_PROVIDER=webhook but CRM_WEBHOOK_URL is not set — falling back to console provider')
    return consoleProvider
  }
  if (selected === 'hubspot') return hubspotProviderStub
  return consoleProvider
}

export async function captureLead(lead: Lead): Promise<CaptureLeadResult> {
  return resolveProvider().captureLead(lead)
}

export async function trackLeadEvent(event: LeadEvent): Promise<void> {
  const provider = resolveProvider()
  if (provider.trackLeadEvent) await provider.trackLeadEvent(event)
}

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
  const provider = resolveProvider()
  if (provider.updateLeadStage) await provider.updateLeadStage(leadId, stage)
}
