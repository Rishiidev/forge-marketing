import 'server-only'
import { readStore, writeStore } from './file-store'

/**
 * CRM adapter layer.
 *
 * Nothing in this file talks to a specific vendor. The rest of the app
 * calls the six operations at the bottom of this file
 * (createLead/updateLead/addLeadEvent/updateLeadStage/addLeadTag/
 * getLeadStatus) without knowing or caring whether leads currently land
 * in an in-memory console log, a generic webhook, HubSpot, or a future
 * custom CRM. Swap the provider by setting CRM_PROVIDER (and
 * provider-specific env vars) — no call site in the app needs to change.
 * See docs/crm.md for the full architecture and lifecycle.
 *
 * Server-only: reads env vars and makes outbound requests, so it must
 * never be imported from a Client Component. Import it from Server
 * Actions or Route Handlers only (see app/actions.ts).
 *
 * Every public function at the bottom of this file catches whatever its
 * provider throws and returns a generic, safe `{ ok: false, error }`
 * instead of letting it propagate — a CRM outage (or the HubSpot stub
 * being selected before it's built) must never turn into an unhandled
 * exception that breaks the page calling it. See docs/crm.md
 * "Graceful degradation."
 */

// ============================================================
// Lead model — docs/crm.md "Lead model"
// ============================================================

export type LeadSource =
  | 'audit'
  | 'website-5000'
  | 'website-15000'
  | 'website-25000'
  | 'maintenance'
  | 'waitlist'
  | 'newsletter'

/**
 * Full CRM lifecycle (docs/crm.md "Lifecycle"). 'anonymous' and
 * 'tool-user' are conceptual pre-CRM states, not stages a real Lead
 * record is ever created at — a visitor in either state has no captured
 * identity yet and is tracked only by lib/analytics.ts (session, not
 * identity), matching the "no dead-end lead record for a non-converting
 * visitor" rule this project has followed since
 * docs/conversion-architecture.md §5. Every real createLead() call
 * starts at 'audit-lead' or later.
 */
export type LeadStage =
  | 'anonymous'
  | 'tool-user'
  | 'audit-lead'
  | 'qualified'
  | 'contacted'
  | 'offer-presented'
  | 'customer'
  | 'website-in-production'
  | 'delivered'
  | 'review-requested'
  | 'review-received'
  | 'showcase-candidate'
  | 'showcase-published'
  | 'referral-partner'
  | 'expansion-opportunity'
  | 'maintenance-customer'
  | 'inactive'

export interface Lead {
  leadId: string
  source: LeadSource
  /** Internal campaign label (e.g. a named outreach batch) — distinct from the raw utmCampaign query param below. Not currently set by any form. */
  campaign?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  /** Path of the page the lead was captured on, e.g. '/audit'. */
  landingPage?: string
  businessName?: string
  /** Website or Google Business Profile URL — whichever the lead gave. */
  businessUrl?: string
  industry?: string
  /** City/area, where voluntarily provided. */
  location?: string
  contactName?: string
  email?: string
  phone?: string
  /**
   * Internal-only. Count of "strong" categories (0-9) from the Forge
   * Free Audit (lib/audit.ts). Never rendered to the visitor — the audit
   * tool deliberately shows no bare score (docs/decisions.md ADR-009);
   * this exists purely for CRM/ops triage.
   */
  auditScore?: number
  /** Internal-only. The audit's top-priority category id, or 'strong' when every category was strong. */
  auditStatus?: string
  /**
   * Free-form labels added via addLeadTag(). Not in the brief's literal
   * field list, but addLeadTag() is a required operation and needs
   * somewhere to persist what it adds — see docs/crm.md.
   */
  tags?: string[]
  /**
   * The referral code (lib/referrals.ts) this lead was attributed to,
   * if any — set once, at creation, by attributeReferralLead(). Added
   * for the post-sale growth architecture (docs/decisions.md ADR-011),
   * same pattern as `tags`: not in the original field list, added
   * because a required capability (referral attribution) needed
   * somewhere on the Lead to record it.
   */
  referredByCode?: string
  currentStage: LeadStage
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}

export type CreateLeadInput = Omit<Lead, 'leadId' | 'tags' | 'currentStage' | 'createdAt' | 'updatedAt' | 'lastActivityAt'> & {
  /** Defaults to 'audit-lead' if omitted — every current source enters the CRM at that stage. */
  initialStage?: LeadStage
  /**
   * Client-generated idempotency key, one per form mount (crypto.randomUUID()).
   * Lets a provider recognize a retried/double submission (e.g. a slow
   * network causing a form library to resubmit) and return the existing
   * lead instead of creating a duplicate. See docs/crm.md "Data quality."
   */
  submissionId?: string
}

export type LeadPatch = Partial<Omit<Lead, 'leadId' | 'createdAt'>>

/**
 * Events worth recording against a specific, already-identified lead.
 * Distinct from lib/analytics.ts's client-side taxonomy, which also
 * covers anonymous/pre-identity visitors — see docs/crm.md "Events vs.
 * analytics" for exactly where the two overlap and where they don't.
 */
export type LeadEventName =
  | 'audit_started'
  | 'audit_completed'
  | 'pricing_viewed'
  | 'pricing_plan_viewed'
  | 'showcase_viewed'
  | 'lead_submitted'
  | 'whatsapp_clicked'
  | 'call_clicked'
  | 'contact_clicked'
  /**
   * Added for the post-sale growth architecture (lib/referrals.ts,
   * docs/decisions.md ADR-011). Note there's no 'referral_click' here —
   * a click on /r/[code] has no lead yet to attach it to (same reasoning
   * as the pre-identity events above); it's tracked in
   * lib/referrals.ts's own click count instead. See docs/architecture.md
   * "Post-sale growth architecture."
   */
  | 'referral_lead'
  | 'referral_conversion'

export interface LeadEvent {
  name: LeadEventName
  properties?: Record<string, string | number | boolean | null>
  /** Defaults to now if omitted — set explicitly when backfilling an event that happened before the lead had a leadId (e.g. the audit itself, completed before the optional follow-up form that creates the lead). */
  occurredAt?: string
}

export interface LeadStatus {
  leadId: string
  currentStage: LeadStage
  updatedAt: string
  lastActivityAt: string
}

export interface CreateLeadResult {
  ok: boolean
  leadId?: string
  error?: string
  /** true when this call matched an existing lead (same submissionId or same email within the dedup window) rather than creating a new record. */
  deduped?: boolean
}
export interface CrmOpResult {
  ok: boolean
  error?: string
}
export interface GetLeadStatusResult {
  ok: boolean
  status?: LeadStatus
  error?: string
}

// ============================================================
// Adapter contract — the six required operations
// ============================================================

export interface CrmAdapter {
  name: string
  createLead(input: CreateLeadInput): Promise<CreateLeadResult>
  updateLead(leadId: string, patch: LeadPatch): Promise<CrmOpResult>
  addLeadEvent(leadId: string, event: LeadEvent): Promise<CrmOpResult>
  updateLeadStage(leadId: string, stage: LeadStage): Promise<CrmOpResult>
  addLeadTag(leadId: string, tag: string): Promise<CrmOpResult>
  getLeadStatus(leadId: string): Promise<GetLeadStatusResult>
}

function generateLeadId(source: LeadSource): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${source.toUpperCase()}-${rand}`
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Never log email/phone/contactName/businessName/businessUrl/location —
 * even on failure. leadId + source + stage + coarse booleans are enough
 * to debug from without putting personal data in server logs that likely
 * outlive the request. See docs/crm.md "Observability."
 */
function safeLogFields(lead: Partial<Lead>) {
  return {
    leadId: lead.leadId,
    source: lead.source,
    currentStage: lead.currentStage,
    hasEmail: Boolean(lead.email),
    hasPhone: Boolean(lead.phone),
  }
}

// ---------------------------------------------------------------------
// Provider: console (default, file-backed)
//
// Used automatically whenever no CRM_PROVIDER env var is set, so local
// development and preview deployments don't silently require real
// credentials. Backed by lib/file-store.ts (a JSON file, not a bare
// in-memory Map) — see that file's doc comment and docs/decisions.md
// ADR-013 for exactly why: a plain module-level Map is not reliably
// shared between a Route Handler and a Server Action in Next.js, even in
// the same running process, which silently broke referral attribution
// during testing. Still single-process/single-machine only — see
// docs/crm.md "Known limitations." Never used once CRM_PROVIDER is set
// to 'webhook' or 'hubspot'.
// ---------------------------------------------------------------------

const LEADS_FILE = 'leads.json'
const SUBMISSIONS_FILE = 'lead-submissions.json' // submissionId -> leadId

function loadLeads(): Record<string, Lead> {
  return readStore<Lead>(LEADS_FILE)
}
function saveLeads(leads: Record<string, Lead>): void {
  writeStore(LEADS_FILE, leads)
}

const DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const consoleProvider: CrmAdapter = {
  name: 'console',
  async createLead(input) {
    const leads = loadLeads()

    if (input.submissionId) {
      const submissions = readStore<string>(SUBMISSIONS_FILE)
      const existingId = submissions[input.submissionId]
      const existing = existingId ? leads[existingId] : undefined
      if (existing) {
        existing.lastActivityAt = nowIso()
        saveLeads(leads)
        console.log('[crm:console] duplicate submission recognized, no new lead created', safeLogFields(existing))
        return { ok: true, leadId: existing.leadId, deduped: true }
      }
    }

    const emailKey = input.email?.trim().toLowerCase()
    if (emailKey) {
      const existing = Object.values(leads).find((l) => l.email?.trim().toLowerCase() === emailKey)
      if (existing && Date.now() - Date.parse(existing.createdAt) < DEDUPE_WINDOW_MS) {
        existing.lastActivityAt = nowIso()
        existing.updatedAt = nowIso()
        // Fold in anything new this submission has that the prior one didn't.
        existing.businessName = existing.businessName ?? input.businessName
        existing.businessUrl = existing.businessUrl ?? input.businessUrl
        existing.contactName = existing.contactName ?? input.contactName
        existing.phone = existing.phone ?? input.phone
        saveLeads(leads)
        if (input.submissionId) {
          const submissions = readStore<string>(SUBMISSIONS_FILE)
          submissions[input.submissionId] = existing.leadId
          writeStore(SUBMISSIONS_FILE, submissions)
        }
        console.log('[crm:console] duplicate lead (same email) folded into existing record', safeLogFields(existing))
        return { ok: true, leadId: existing.leadId, deduped: true }
      }
    }

    const leadId = generateLeadId(input.source)
    const timestamp = nowIso()
    const lead: Lead = {
      leadId,
      source: input.source,
      campaign: input.campaign,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      landingPage: input.landingPage,
      businessName: input.businessName,
      businessUrl: input.businessUrl,
      industry: input.industry,
      location: input.location,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      auditScore: input.auditScore,
      auditStatus: input.auditStatus,
      tags: [],
      currentStage: input.initialStage ?? 'audit-lead',
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActivityAt: timestamp,
    }
    leads[leadId] = lead
    saveLeads(leads)
    if (input.submissionId) {
      const submissions = readStore<string>(SUBMISSIONS_FILE)
      submissions[input.submissionId] = leadId
      writeStore(SUBMISSIONS_FILE, submissions)
    }
    console.log('[crm:console] lead created', safeLogFields(lead))
    return { ok: true, leadId }
  },
  async updateLead(leadId, patch) {
    const leads = loadLeads()
    const lead = leads[leadId]
    if (!lead) return { ok: false, error: 'lead not found' }
    Object.assign(lead, patch, { updatedAt: nowIso(), lastActivityAt: nowIso() })
    saveLeads(leads)
    console.log('[crm:console] lead updated', safeLogFields(lead))
    return { ok: true }
  },
  async addLeadEvent(leadId, event) {
    const leads = loadLeads()
    const lead = leads[leadId]
    if (!lead) return { ok: false, error: 'lead not found' }
    lead.lastActivityAt = nowIso()
    saveLeads(leads)
    console.log('[crm:console] event', { leadId, name: event.name, properties: event.properties, occurredAt: event.occurredAt ?? nowIso() })
    return { ok: true }
  },
  async updateLeadStage(leadId, stage) {
    const leads = loadLeads()
    const lead = leads[leadId]
    if (!lead) return { ok: false, error: 'lead not found' }
    lead.currentStage = stage
    lead.updatedAt = nowIso()
    lead.lastActivityAt = nowIso()
    saveLeads(leads)
    console.log('[crm:console] stage update', { leadId, stage })
    return { ok: true }
  },
  async addLeadTag(leadId, tag) {
    const leads = loadLeads()
    const lead = leads[leadId]
    if (!lead) return { ok: false, error: 'lead not found' }
    lead.tags = lead.tags ? [...new Set([...lead.tags, tag])] : [tag]
    lead.lastActivityAt = nowIso()
    saveLeads(leads)
    console.log('[crm:console] tag added', { leadId, tag })
    return { ok: true }
  },
  async getLeadStatus(leadId) {
    const leads = loadLeads()
    const lead = leads[leadId]
    if (!lead) return { ok: false, error: 'lead not found' }
    return {
      ok: true,
      status: { leadId: lead.leadId, currentStage: lead.currentStage, updatedAt: lead.updatedAt, lastActivityAt: lead.lastActivityAt },
    }
  },
}

// ---------------------------------------------------------------------
// Provider: webhook
//
// The generic, documented integration path — POSTs typed envelopes to
// CRM_WEBHOOK_URL. Works with Zapier, Make, n8n, a HubSpot forms-relay
// endpoint, or a fully custom lightweight backend endpoint. Recommended
// for a real (non-console) deployment until a specific vendor adapter is
// built. Every call has a hard timeout so a slow/unreachable CRM can
// never hang a Server Action — see docs/crm.md "Graceful degradation."
// ---------------------------------------------------------------------

const WEBHOOK_TIMEOUT_MS = 5000

async function postToWebhook(webhookUrl: string, body: unknown): Promise<{ ok: boolean; json?: unknown; error?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)
  try {
    // CRM_WEBHOOK_SECRET is an optional, server-only env var this code
    // reads by name — no value is invented or defaulted here. Unset by
    // default in this repo (no .env exists), matching every other
    // provider credential in this project.
    const secret = process.env.CRM_WEBHOOK_SECRET
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return { ok: false, error: `webhook responded ${res.status}` }
    const json = await res.json().catch(() => undefined)
    return { ok: true, json }
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError'
    return { ok: false, error: timedOut ? 'webhook timed out' : 'webhook request failed' }
  } finally {
    clearTimeout(timeout)
  }
}

function createWebhookProvider(webhookUrl: string): CrmAdapter {
  return {
    name: 'webhook',
    async createLead(input) {
      const leadId = generateLeadId(input.source)
      const timestamp = nowIso()
      const result = await postToWebhook(webhookUrl, {
        type: 'lead.created',
        leadId,
        lead: { ...input, currentStage: input.initialStage ?? 'audit-lead', createdAt: timestamp, updatedAt: timestamp, lastActivityAt: timestamp },
      })
      if (!result.ok) {
        console.error('[crm:webhook] createLead failed', { source: input.source, error: result.error })
        return { ok: false, error: result.error }
      }
      return { ok: true, leadId }
    },
    async updateLead(leadId, patch) {
      const result = await postToWebhook(webhookUrl, { type: 'lead.updated', leadId, patch, updatedAt: nowIso() })
      if (!result.ok) console.error('[crm:webhook] updateLead failed', { leadId, error: result.error })
      return result
    },
    async addLeadEvent(leadId, event) {
      const result = await postToWebhook(webhookUrl, { type: 'lead.event', leadId, event: { ...event, occurredAt: event.occurredAt ?? nowIso() } })
      if (!result.ok) console.error('[crm:webhook] addLeadEvent failed', { leadId, name: event.name, error: result.error })
      return result
    },
    async updateLeadStage(leadId, stage) {
      const result = await postToWebhook(webhookUrl, { type: 'lead.stage', leadId, stage, updatedAt: nowIso() })
      if (!result.ok) console.error('[crm:webhook] updateLeadStage failed', { leadId, stage, error: result.error })
      return result
    },
    async addLeadTag(leadId, tag) {
      const result = await postToWebhook(webhookUrl, { type: 'lead.tag', leadId, tag })
      if (!result.ok) console.error('[crm:webhook] addLeadTag failed', { leadId, error: result.error })
      return result
    },
    async getLeadStatus(leadId) {
      // Best-effort: not every webhook target can answer a query (a
      // one-way Zapier/Make webhook, for instance, cannot). A real
      // provider-specific adapter (e.g. a HubSpot implementation) should
      // implement this against that vendor's actual read API instead.
      const result = await postToWebhook(webhookUrl, { type: 'lead.status.query', leadId })
      if (!result.ok) {
        console.error('[crm:webhook] getLeadStatus failed', { leadId, error: result.error })
        return { ok: false, error: result.error }
      }
      const status = result.json as Partial<LeadStatus> | undefined
      if (!status?.currentStage) {
        return { ok: false, error: 'The configured webhook does not support status queries. See docs/crm.md "Known limitations."' }
      }
      return { ok: true, status: { leadId, currentStage: status.currentStage, updatedAt: status.updatedAt ?? '', lastActivityAt: status.lastActivityAt ?? '' } }
    },
  }
}

// ---------------------------------------------------------------------
// Provider: HubSpot (stub)
//
// Not implemented. Exists to show the exact shape a real integration
// would take, and to fail loudly and clearly if selected before it's
// built, rather than silently dropping leads. See docs/crm.md.
// ---------------------------------------------------------------------

function notImplemented(op: string): never {
  throw new Error(`CRM_PROVIDER=hubspot is selected but ${op}() is not implemented yet. See docs/crm.md and docs/forge-business-rules.md Human Decision #11.`)
}

const hubspotProviderStub: CrmAdapter = {
  name: 'hubspot',
  async createLead() {
    notImplemented('createLead')
  },
  async updateLead() {
    notImplemented('updateLead')
  },
  async addLeadEvent() {
    notImplemented('addLeadEvent')
  },
  async updateLeadStage() {
    notImplemented('updateLeadStage')
  },
  async addLeadTag() {
    notImplemented('addLeadTag')
  },
  async getLeadStatus() {
    notImplemented('getLeadStatus')
  },
}

function resolveProvider(): CrmAdapter {
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

// ============================================================
// Public API — the six required operations.
//
// Every one of these catches whatever its provider throws (a network
// error, the HubSpot stub, a bug in a future adapter) and resolves to a
// safe, generic result instead of rejecting — see docs/crm.md "Graceful
// degradation." A caller can always trust that these never throw.
// ============================================================

const GRACEFUL_ERROR = 'The CRM is temporarily unavailable. This does not affect the rest of the site.'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  try {
    return await resolveProvider().createLead(input)
  } catch (err) {
    console.error('[crm] createLead threw', { source: input.source, message: errorMessage(err) })
    return { ok: false, error: GRACEFUL_ERROR }
  }
}

export async function updateLead(leadId: string, patch: LeadPatch): Promise<CrmOpResult> {
  try {
    return await resolveProvider().updateLead(leadId, patch)
  } catch (err) {
    console.error('[crm] updateLead threw', { leadId, message: errorMessage(err) })
    return { ok: false, error: GRACEFUL_ERROR }
  }
}

export async function addLeadEvent(leadId: string, event: LeadEvent): Promise<CrmOpResult> {
  try {
    return await resolveProvider().addLeadEvent(leadId, event)
  } catch (err) {
    console.error('[crm] addLeadEvent threw', { leadId, name: event.name, message: errorMessage(err) })
    return { ok: false, error: GRACEFUL_ERROR }
  }
}

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<CrmOpResult> {
  try {
    return await resolveProvider().updateLeadStage(leadId, stage)
  } catch (err) {
    console.error('[crm] updateLeadStage threw', { leadId, stage, message: errorMessage(err) })
    return { ok: false, error: GRACEFUL_ERROR }
  }
}

export async function addLeadTag(leadId: string, tag: string): Promise<CrmOpResult> {
  try {
    return await resolveProvider().addLeadTag(leadId, tag)
  } catch (err) {
    console.error('[crm] addLeadTag threw', { leadId, message: errorMessage(err) })
    return { ok: false, error: GRACEFUL_ERROR }
  }
}

export async function getLeadStatus(leadId: string): Promise<GetLeadStatusResult> {
  try {
    return await resolveProvider().getLeadStatus(leadId)
  } catch (err) {
    console.error('[crm] getLeadStatus threw', { leadId, message: errorMessage(err) })
    return { ok: false, error: GRACEFUL_ERROR }
  }
}
