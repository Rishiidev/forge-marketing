'use client'

import { useState, type FormEvent } from 'react'
import { AUDIT_CATEGORIES, type AuditInput } from '@/lib/audit'
import { CATEGORY_OPTIONS } from '@/lib/constants'
import { normalizeUrl } from '@/lib/validation'
import { TextField } from '@/components/forms/TextField'
import { SelectField } from '@/components/forms/SelectField'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/utils'

export function AuditInputForm({ onSubmit }: { onSubmit: (input: AuditInput) => void }) {
  const [businessName, setBusinessName] = useState('')
  const [googleProfileUrl, setGoogleProfileUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedUrl = normalizeUrl(googleProfileUrl)
    const unanswered = AUDIT_CATEGORIES.filter((c) => !answers[c.id])

    if (!businessName.trim()) {
      setError('Enter your business name.')
      return
    }
    if (!normalizedUrl) {
      setError('Enter your Google Business Profile link (e.g. https://g.page/your-business).')
      return
    }
    if (unanswered.length > 0) {
      setError(`Answer every question — ${unanswered.length} question${unanswered.length > 1 ? 's are' : ' is'} still unanswered.`)
      return
    }

    setError(null)
    onSubmit({
      businessName: businessName.trim(),
      googleProfileUrl: normalizedUrl,
      industry: industry || undefined,
      location: location.trim() || undefined,
      answers,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10">
      <div className="grid gap-4 rounded-2xl border border-border bg-white p-7 shadow-md sm:grid-cols-2">
        <TextField
          label="Business name"
          name="businessName"
          type="text"
          placeholder="e.g. Studio Mysa"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
        <TextField
          label="Google Business Profile link"
          name="googleProfileUrl"
          type="text"
          placeholder="https://g.page/your-business"
          value={googleProfileUrl}
          onChange={(e) => setGoogleProfileUrl(e.target.value)}
          required
        />
        <SelectField
          label="Industry (optional)"
          name="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">Select your category</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </SelectField>
        <TextField
          label="City (optional)"
          name="location"
          type="text"
          placeholder="e.g. Bengaluru"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {AUDIT_CATEGORIES.map((category, index) => (
          <fieldset key={category.id} className="rounded-2xl border border-border bg-white p-6">
            <legend className="mb-4 px-1 text-body font-semibold text-ink">
              {index + 1}. {category.prompt}
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {category.options.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'focus-within:ring-2 focus-within:ring-ground cursor-pointer rounded-md border border-border px-4 py-3 text-body-sm text-ink-3 transition-colors',
                    'has-[:checked]:border-ground has-[:checked]:bg-paper-2 has-[:checked]:font-semibold has-[:checked]:text-ink'
                  )}
                >
                  <input
                    type="radio"
                    name={category.id}
                    value={option.value}
                    checked={answers[category.id] === option.value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [category.id]: option.value }))}
                    className="sr-only"
                    required
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-body-sm text-warm">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start">
        See my results
      </Button>
      <Text size="body-sm">No upsell inside the audit. This is a self-serve first look — Forge reviews it further only if you ask.</Text>
    </form>
  )
}
