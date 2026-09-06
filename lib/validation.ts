/**
 * Shared, minimal input validators for lead-capture forms. Centralized so
 * every Server Action validates email/URL input the same way instead of
 * each one growing its own slightly-different regex over time.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

/**
 * Normalizes a loosely-typed URL (e.g. a pasted Google Business Profile
 * or website link that may be missing "https://") and validates it's at
 * least a well-formed URL. Returns null for anything that isn't,
 * including an empty string.
 */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(withProtocol).toString()
  } catch {
    return null
  }
}
