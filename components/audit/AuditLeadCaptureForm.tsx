'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { submitAuditLeadAction } from '@/app/actions'
import { trackEvent } from '@/lib/analytics'
import { TextField } from '@/components/forms/TextField'
import { Honeypot } from '@/components/forms/Honeypot'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { FormStatus, type FormStatusState } from '@/components/forms/FormStatus'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import type { AuditResult } from '@/lib/audit'

interface AuditLeadCaptureFormProps {
  result: AuditResult
  industry?: string
  location?: string
}

/**
 * Optional follow-up capture at the end of the audit — this is the only
 * point in the tool that talks to the CRM (lib/crm.ts via
 * app/actions.ts submitAuditLeadAction). A visitor who skips this still
 * got the full, real result above; nothing is gated behind giving contact
 * info. See docs/decisions.md ADR-009.
 */
export function AuditLeadCaptureForm({ result, industry, location }: AuditLeadCaptureFormProps) {
  const [status, setStatus] = useState<FormStatusState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [attribution, setAttribution] = useState({ landingPage: '', utm_source: '', utm_medium: '', utm_campaign: '' })
  // One idempotency key per mount — lets the CRM adapter recognize a
  // retried/double submission instead of creating a duplicate lead. See
  // lib/crm.ts CreateLeadInput.submissionId.
  const submissionId = useRef(crypto.randomUUID())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setAttribution({
      landingPage: window.location.pathname,
      utm_source: params.get('utm_source') ?? '',
      utm_medium: params.get('utm_medium') ?? '',
      utm_campaign: params.get('utm_campaign') ?? '',
    })
  }, [])

  function submit(formData: FormData) {
    setStatus('pending')
    setError(null)

    startTransition(async () => {
      const response = await submitAuditLeadAction(formData)
      if (response.ok) {
        setStatus('success')
        trackEvent({ name: 'lead_submitted', props: { source: 'audit', leadId: response.leadId } })
      } else {
        setStatus('error')
        setError(response.error ?? null)
        trackEvent({ name: 'lead_submit_error', props: { source: 'audit', error: response.error } })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-7 shadow-md">
      <Heading as="h3" size="heading-sm" className="mb-2">
        Want a human to double-check this?
      </Heading>
      <Text size="body-sm" className="mb-5">
        Leave an email or WhatsApp number (optional — name too) and Forge will confirm this by hand and text you next steps. No list, no spam.
      </Text>
      <form action={submit} className="grid gap-4 sm:grid-cols-2">
        <Honeypot />
        <input type="hidden" name="business" value={result.businessName} />
        <input type="hidden" name="googleProfileUrl" value={result.googleProfileUrl} />
        <input type="hidden" name="category" value={industry ?? ''} />
        <input type="hidden" name="location" value={location ?? ''} />
        <input type="hidden" name="topCategory" value={result.recommendation.categoryId ?? ''} />
        <input type="hidden" name="strongCount" value={result.counts.strong} />
        <input type="hidden" name="weakCount" value={result.counts.weak} />
        <input type="hidden" name="missingCount" value={result.counts.missing} />
        <input type="hidden" name="landingPage" value={attribution.landingPage} />
        <input type="hidden" name="utm_source" value={attribution.utm_source} />
        <input type="hidden" name="utm_medium" value={attribution.utm_medium} />
        <input type="hidden" name="utm_campaign" value={attribution.utm_campaign} />
        <input type="hidden" name="submissionId" value={submissionId.current} />

        <TextField label="Name (optional)" name="name" type="text" placeholder="Your name" className="sm:col-span-2" />
        <TextField label="Email (optional)" name="email" type="email" placeholder="you@business.com" />
        <TextField label="WhatsApp (optional)" name="whatsapp" type="tel" placeholder="+91 99999 99999" />
        <div className="sm:col-span-2">
          <SubmitButton pending={isPending}>Send me next steps</SubmitButton>
          <FormStatus status={status} error={error} />
        </div>
      </form>
    </div>
  )
}
