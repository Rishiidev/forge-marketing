'use client'

import { useState, useTransition } from 'react'
import { submitLeadAction } from '@/app/actions'
import { trackEvent } from '@/lib/analytics'
import type { LeadSource } from '@/lib/crm'
import type { FormStatusState } from './FormStatus'

export function useLeadForm(source: LeadSource) {
  const [status, setStatus] = useState<FormStatusState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setStatus('pending')
    setError(null)

    startTransition(async () => {
      const result = await submitLeadAction(source, formData)
      if (result.ok) {
        setStatus('success')
        trackEvent({ name: 'lead_submitted', props: { source, leadId: result.leadId } })
      } else {
        setStatus('error')
        setError(result.error ?? null)
        trackEvent({ name: 'lead_submit_error', props: { source, error: result.error } })
      }
    })
  }

  return { submit, status, error, isPending }
}
