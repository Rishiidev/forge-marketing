'use client'

import { TextField } from '@/components/forms/TextField'
import { SelectField } from '@/components/forms/SelectField'
import { Honeypot } from '@/components/forms/Honeypot'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { FormStatus } from '@/components/forms/FormStatus'
import { useLeadForm } from '@/components/forms/useLeadForm'
import { CATEGORY_OPTIONS } from '@/lib/constants'

/**
 * The free 7-point audit request form. Field set matches
 * legacy/audit.html (name, email, business, category, Google Business
 * Profile link, WhatsApp) — see docs/forge-business-rules.md §5.
 */
export function AuditForm() {
  const { submit, status, error, isPending } = useLeadForm('audit')

  return (
    <form action={submit} className="grid gap-4 rounded-2xl border border-border bg-white p-7 shadow-md">
      <Honeypot />
      <TextField label="Your name" name="name" type="text" placeholder="e.g. Priya Shah" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Email" name="email" type="email" placeholder="you@business.com" required />
        <TextField label="Business name" name="business" type="text" placeholder="e.g. Studio Mysa" required />
      </div>
      <SelectField label="Category" name="category" defaultValue="" required>
        <option value="" disabled>
          Select your category
        </option>
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectField>
      <TextField
        label="Google Business Profile link"
        name="googleProfileUrl"
        type="url"
        placeholder="https://g.page/your-business"
        required
      />
      <TextField label="Your WhatsApp number (optional)" name="whatsapp" type="tel" placeholder="+91 99999 99999" />
      <SubmitButton pending={isPending}>Send my free audit</SubmitButton>
      <FormStatus status={status} error={error} />
    </form>
  )
}
