'use server'

import { captureLead, trackLeadEvent, type Lead, type LeadSource } from '@/lib/crm'

export interface SubmitLeadResult {
  ok: boolean
  leadId?: string
  error?: string
}

/**
 * Single Server Action behind every lead form on the site
 * (components/forms/useLeadForm.ts calls this directly). Keeps the CRM
 * abstraction (lib/crm.ts) free of any Next.js-specific concerns.
 */
export async function submitLeadAction(source: LeadSource, formData: FormData): Promise<SubmitLeadResult> {
  // Honeypot: a real visitor never fills this in. Pretend success so a
  // bot doesn't learn anything from the response.
  const honeypot = String(formData.get('website') ?? '')
  if (honeypot) {
    return { ok: true, leadId: 'dropped' }
  }

  const email = String(formData.get('email') ?? '').trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const lead: Lead = {
    source,
    email,
    name: optionalField(formData, 'name'),
    whatsapp: optionalField(formData, 'whatsapp'),
    business: optionalField(formData, 'business'),
    category: optionalField(formData, 'category'),
    googleProfileUrl: optionalField(formData, 'googleProfileUrl'),
    message: optionalField(formData, 'message'),
  }

  const result = await captureLead(lead)
  if (result.ok) {
    await trackLeadEvent({ leadId: result.leadId, name: 'lead_captured', properties: { source } })
  }

  return { ok: result.ok, leadId: result.leadId, error: result.error }
}

function optionalField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}
