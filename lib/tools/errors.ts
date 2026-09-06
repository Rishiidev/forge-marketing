/**
 * Normalizes whatever a tool's run() function might throw (or a
 * validation/security failure) into a typed ToolError — so
 * components/tools/ToolError.tsx and lib/tools/execution.ts never have
 * to branch on `unknown`, and a server log never gets a raw stack trace
 * concatenated into a visitor-facing string.
 *
 * Client-safe: no secrets, no server-only import.
 */

import type { ToolError } from './types'

export const TOOL_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  SSRF_BLOCKED: 'SSRF_BLOCKED',
  UNSUPPORTED_CONTENT_TYPE: 'UNSUPPORTED_CONTENT_TYPE',
  RESPONSE_TOO_LARGE: 'RESPONSE_TOO_LARGE',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
} as const

export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[keyof typeof TOOL_ERROR_CODES]

/** Whether retrying the same input again is worth offering the visitor a button for. */
const RETRYABLE_CODES: ToolErrorCode[] = [TOOL_ERROR_CODES.TIMEOUT, TOOL_ERROR_CODES.UPSTREAM_UNAVAILABLE, TOOL_ERROR_CODES.UNKNOWN]

export function makeToolError(code: ToolErrorCode, message: string): ToolError {
  return { code, message, retryable: RETRYABLE_CODES.includes(code) }
}

/**
 * Converts an unknown thrown value (from a tool's own run() function, or
 * from lib/tools/security.ts's safeFetch) into a safe, visitor-facing
 * ToolError. Never includes the raw error's stack or message verbatim —
 * a tool author who wants a specific visitor-facing message should throw
 * (or return) a ToolError-shaped object directly, matching-checked via
 * isToolError() below.
 */
export function isToolError(value: unknown): value is ToolError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'retryable' in value
  )
}

export function toToolError(err: unknown): ToolError {
  if (isToolError(err)) return err
  if (err instanceof Error && err.name === 'AbortError') {
    return makeToolError(TOOL_ERROR_CODES.TIMEOUT, "This took too long to check. Try again in a moment.")
  }
  return makeToolError(TOOL_ERROR_CODES.UNKNOWN, "Something went wrong running this tool. Try again in a moment.")
}
