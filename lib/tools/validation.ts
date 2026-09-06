/**
 * Generic input validation for the tools engine, driven entirely by a
 * tool's own `inputFields` (lib/tools/types.ts ToolInputFieldDefinition)
 * — a new tool gets a working, consistent validator for free just by
 * declaring its fields, matching docs/tools-cost-policy.md §G's "input
 * size and shape limits" requirement.
 *
 * Reuses lib/validation.ts's existing isValidEmail/normalizeUrl rather
 * than re-implementing them — same single-source-of-truth discipline
 * ADR-010 already established for email/URL checks site-wide.
 *
 * Client-safe: no secrets, no server-only import — the same validator
 * runs in components/tools/ToolInput.tsx (client) and, if a tool's
 * run() needs to re-validate server-side, from there too.
 */

import { isValidEmail, normalizeUrl } from '@/lib/validation'
import type { ToolInput, ToolInputFieldDefinition } from './types'

/** Defensive ceiling even when a field doesn't declare its own maxLength — see docs/tools-cost-policy.md §G. */
const DEFAULT_MAX_LENGTH = 500

export interface FieldValidationError {
  fieldId: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: FieldValidationError[]
  /** Present only when ok is true — the same values, trimmed and (for 'url' fields) normalized. */
  value?: ToolInput
}

function readString(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (raw === null || raw === undefined) return ''
  return String(raw)
}

/**
 * Validates one field's raw value against its definition. Returns the
 * cleaned value on success (trimmed; normalized for 'url') so a caller
 * never has to re-derive it.
 */
function validateField(field: ToolInputFieldDefinition, rawValue: unknown): { error?: string; value?: unknown } {
  const trimmed = readString(rawValue).trim()
  const maxLength = field.maxLength ?? DEFAULT_MAX_LENGTH

  if (!trimmed) {
    return field.required ? { error: `${field.label} is required.` } : { value: undefined }
  }

  if (trimmed.length > maxLength) {
    return { error: `${field.label} is too long (max ${maxLength} characters).` }
  }

  switch (field.type) {
    case 'email':
      return isValidEmail(trimmed) ? { value: trimmed } : { error: `Enter a valid email for ${field.label}.` }
    case 'url': {
      const normalized = normalizeUrl(trimmed)
      return normalized ? { value: normalized } : { error: `Enter a valid link for ${field.label}.` }
    }
    case 'select': {
      const allowed = new Set((field.options ?? []).map((o) => o.value))
      return allowed.has(trimmed) ? { value: trimmed } : { error: `Choose a valid option for ${field.label}.` }
    }
    case 'text':
    case 'textarea':
    default:
      return { value: trimmed }
  }
}

/**
 * Validates a whole raw input object against a tool's declared
 * inputFields. Unknown fields not in the schema are dropped, not passed
 * through — a tool's run() only ever sees exactly what it declared.
 */
export function validateToolInput(fields: ToolInputFieldDefinition[], rawInput: ToolInput): ValidationResult {
  const errors: FieldValidationError[] = []
  const value: ToolInput = {}

  for (const field of fields) {
    const { error, value: cleaned } = validateField(field, rawInput[field.id])
    if (error) {
      errors.push({ fieldId: field.id, message: error })
      continue
    }
    if (cleaned !== undefined) value[field.id] = cleaned
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, errors: [], value }
}

/** Single human-readable summary line for a validation failure — used by ToolInput's aria-live error region. */
export function summarizeValidationErrors(errors: FieldValidationError[]): string {
  if (errors.length === 1) return errors[0]!.message
  return `Fix ${errors.length} fields: ${errors.map((e) => e.message).join(' ')}`
}
