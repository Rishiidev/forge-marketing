'use server'

import { headers, cookies } from 'next/headers'
import { createLead, addLeadEvent, type LeadSource, type CreateLeadResult } from '@/lib/crm'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidEmail, normalizeUrl } from '@/lib/validation'
import { attributeReferralLead } from '@/lib/referrals'

const REFERRAL_COOKIE = 'forge_ref'

/**
 * Attributes a brand-new lead to whichever referral code sent them here
 * (app/r/[code]/route.ts sets this cookie on click). Only fires for a
 * genuinely new lead — never for a deduped/repeat submission, since
 * attributing an existing customer's own later visit to "a referral"
 * would misrepresent where they actually came from.
 */
async function attributeReferralIfPresent(result: CreateLeadResult): Promise<void> {
  if (!result.ok || !result.leadId || result.deduped) return
  const code = (await cookies()).get(REFERRAL_COOKIE)?.value
  if (!code) return
  await attributeReferralLead(code, result.leadId)
}

export interface SubmitLeadResult {
  ok: boolean
  leadId?: string
  error?: string
}

// 5 submissions per 10 minutes per client — see lib/rate-limit.ts for
// what this does and doesn't guarantee.
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }

async function getRateLimitKey(): Promise<string> {
  const h = await headers()
  // x-forwarded-for can carry a comma-separated proxy chain; the first
  // entry is the original client. Falls back to a single shared bucket
  // in local dev, where nothing sets this header at all.
  const forwardedFor = h.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim()
  return ip || 'local-dev'
}

/**
 * Best-effort attribution fallback for forms that don't carry their own
 * hidden utm_ / landingPage fields (i.e. the generic AuditForm embed).
 * Reads the Referer header of the request that submitted the form — for
 * a form embedded directly on the page the visitor is on, this is that
 * exact page, query string included. Doesn't survive navigating away
 * before submitting, and some browsers/privacy modes omit Referer
 * entirely — see docs/crm.md "Known limitations."
 */
async function deriveAttributionFromReferer(): Promise<{
  landingPage?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}> {
  const h = await headers()
  const referer = h.get('referer')
  if (!referer) return {}
  try {
    const url = new URL(referer)
    return {
      landingPage: url.pathname,
      utmSource: url.searchParams.get('utm_source') ?? undefined,
      utmMedium: url.searchParams.get('utm_medium') ?? undefined,
      utmCampaign: url.searchParams.get('utm_campaign') ?? undefined,
    }
  } catch {
    return {}
  }
}

function optionalField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Single Server Action behind the simple embedded lead form
 * (components/audit/AuditForm.tsx, used on the homepage and
 * /design-system — components/forms/useLeadForm.ts calls this directly).
 */
export async function submitLeadAction(source: LeadSource, formData: FormData): Promise<SubmitLeadResult> {
  // Honeypot: a real visitor never fills this in. Pretend success so a
  // bot doesn't learn anything from the response.
  const honeypot = String(formData.get('website') ?? '')
  if (honeypot) {
    return { ok: true, leadId: 'dropped' }
  }

  const rateLimitKey = await getRateLimitKey()
  if (!checkRateLimit(`lead:${rateLimitKey}`, RATE_LIMIT).allowed) {
    return { ok: false, error: 'Too many submissions. Please try again in a few minutes.' }
  }

  const email = String(formData.get('email') ?? '').trim()
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const rawUrl = optionalField(formData, 'googleProfileUrl')
  const businessUrl = rawUrl ? normalizeUrl(rawUrl) : undefined
  if (rawUrl && !businessUrl) {
    return { ok: false, error: 'Enter a valid link (e.g. https://g.page/your-business).' }
  }

  const attribution = await deriveAttributionFromReferer()

  const result = await createLead({
    source,
    email,
    contactName: optionalField(formData, 'name'),
    phone: optionalField(formData, 'whatsapp'),
    businessName: optionalField(formData, 'business'),
    industry: optionalField(formData, 'category'),
    businessUrl: businessUrl ?? undefined,
    ...attribution,
    submissionId: optionalField(formData, 'submissionId'),
  })

  if (result.ok && result.leadId) {
    await addLeadEvent(result.leadId, { name: 'lead_submitted', properties: { source } })
    await attributeReferralIfPresent(result)
  }

  return { ok: result.ok, leadId: result.leadId, error: result.error }
}

/**
 * Server Action behind the Forge Free Audit tool's optional follow-up
 * capture (components/audit/AuditLeadCaptureForm.tsx). Deliberately
 * separate from submitLeadAction above: every other form requires a
 * valid email up front, but the audit tool's purpose is to give every
 * visitor a useful result first and only capture a lead when they're
 * "identifiable" — email OR WhatsApp, either one, sometimes neither. See
 * docs/decisions.md ADR-009, docs/crm.md, and
 * docs/forge-business-rules.md Human Decision #11 (CRM strategy).
 */
export async function submitAuditLeadAction(formData: FormData): Promise<SubmitLeadResult> {
  const honeypot = String(formData.get('website') ?? '')
  if (honeypot) {
    return { ok: true, leadId: 'dropped' }
  }

  const rateLimitKey = await getRateLimitKey()
  if (!checkRateLimit(`lead:${rateLimitKey}`, RATE_LIMIT).allowed) {
    return { ok: false, error: 'Too many submissions. Please try again in a few minutes.' }
  }

  const email = optionalField(formData, 'email')
  const whatsapp = optionalField(formData, 'whatsapp')

  if (!email && !whatsapp) {
    return { ok: false, error: 'Add an email or WhatsApp number so Forge can follow up.' }
  }
  if (email && !isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const rawUrl = optionalField(formData, 'googleProfileUrl')
  // Already validated once in AuditInputForm — re-validated defensively,
  // but this field isn't user-editable at this step, so a malformed
  // value falls back to the raw string rather than blocking a visitor's
  // follow-up request over a field they didn't just type.
  const businessUrl = (rawUrl && normalizeUrl(rawUrl)) || rawUrl

  const topCategory = optionalField(formData, 'topCategory') ?? ''
  const strongCount = Number(formData.get('strongCount') ?? 0)
  const weakCount = Number(formData.get('weakCount') ?? 0)
  const missingCount = Number(formData.get('missingCount') ?? 0)

  const result = await createLead({
    source: 'audit',
    email,
    phone: whatsapp,
    contactName: optionalField(formData, 'name'),
    businessName: optionalField(formData, 'business'),
    businessUrl,
    industry: optionalField(formData, 'category'),
    location: optionalField(formData, 'location'),
    auditScore: strongCount,
    auditStatus: topCategory || 'strong',
    landingPage: optionalField(formData, 'landingPage'),
    utmSource: optionalField(formData, 'utm_source'),
    utmMedium: optionalField(formData, 'utm_medium'),
    utmCampaign: optionalField(formData, 'utm_campaign'),
    submissionId: optionalField(formData, 'submissionId'),
  })

  if (result.ok && result.leadId) {
    await addLeadEvent(result.leadId, {
      name: 'audit_completed',
      properties: { strongCount, weakCount, missingCount },
    })
    await addLeadEvent(result.leadId, { name: 'lead_submitted', properties: { source: 'audit' } })
    await attributeReferralIfPresent(result)
  }

  return { ok: result.ok, leadId: result.leadId, error: result.error }
}
