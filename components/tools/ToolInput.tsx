'use client'

import { useState, type FormEvent } from 'react'
import type { ToolInputFieldDefinition, ToolInput as ToolInputShape } from '@/lib/tools/types'
import { validateToolInput, summarizeValidationErrors } from '@/lib/tools/validation'
import { TextField } from '@/components/forms/TextField'
import { SelectField } from '@/components/forms/SelectField'
import { Textarea } from '@/components/ui/Textarea'
import { Honeypot } from '@/components/forms/Honeypot'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'

interface ToolInputProps {
  fields: ToolInputFieldDefinition[]
  onSubmit: (input: ToolInputShape) => void
  submitLabel?: string
}

/**
 * Generic, schema-driven input form — a new tool gets a working,
 * accessible, validated form purely by declaring `inputFields`
 * (lib/tools/types.ts ToolDefinition), matching this project's
 * "reusable engine, not per-tool UI" goal (docs/tool-architecture.md).
 *
 * Honeypot is included on every instance, uncoupled from the declared
 * schema, per docs/tools-cost-policy.md §G — a tool author never has to
 * remember to add it themselves.
 *
 * Uncontrolled inputs, validated from FormData on submit — the same
 * shape components/audit/AuditLeadCaptureForm.tsx already uses, chosen
 * here for the same reason: no per-keystroke re-render for what's
 * ultimately a one-shot submission, and one honeypot check works
 * uniformly regardless of how many fields a given tool declares.
 */
export function ToolInput({ fields, onSubmit, submitLabel = 'Run this check' }: ToolInputProps) {
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    // A real visitor never fills this in — silently drop, same
    // "pretend nothing happened" pattern app/actions.ts uses for the
    // site's lead forms, so a bot learns nothing from the response.
    if (String(formData.get('website') ?? '')) return

    const rawInput: Record<string, unknown> = {}
    for (const field of fields) rawInput[field.id] = formData.get(field.id)

    const validation = validateToolInput(fields, rawInput)
    if (!validation.ok) {
      setError(summarizeValidationErrors(validation.errors))
      return
    }
    setError(null)
    onSubmit(validation.value ?? {})
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      <Honeypot />
      <div className="grid gap-4 rounded-2xl border border-border bg-white p-7 shadow-md sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            {field.type === 'select' ? (
              <SelectField label={field.label} name={field.id} defaultValue="">
                <option value="" disabled>
                  {field.placeholder ?? 'Choose one'}
                </option>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            ) : field.type === 'textarea' ? (
              <div className="grid gap-1.5">
                <label htmlFor={field.id} className="text-body-sm font-semibold text-ink">
                  {field.label}
                </label>
                <Textarea id={field.id} name={field.id} placeholder={field.placeholder} maxLength={field.maxLength} />
              </div>
            ) : (
              <TextField
                label={field.label}
                name={field.id}
                type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
              />
            )}
            {field.helpText && (
              <Text size="body-sm" className="mt-1.5">
                {field.helpText}
              </Text>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-body-sm text-warm">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start">
        {submitLabel}
      </Button>
    </form>
  )
}
