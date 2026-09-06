/**
 * The tools engine's execution layer: the state machine every tool page
 * runs through (idle → validating → processing → success | partial |
 * error), and the orchestrator that actually runs a tool's own `run()`
 * against validated input, normalizing whatever it throws.
 *
 * Client-safe: no secrets, no server-only import. A tool whose run()
 * needs server-only capabilities (lib/tools/security.ts's safeFetch,
 * lib/tools/cache.ts) still calls runTool() from the client — run()
 * itself is what crosses the server boundary (e.g. via a Server Action
 * or Route Handler it calls internally), the same way
 * AuditLeadCaptureForm.tsx calls a Server Action without this layer
 * needing to know that's happening.
 */

import { validateToolInput, summarizeValidationErrors, type ValidationResult } from './validation'
import { toToolError } from './errors'
import { computeOverallStatus } from './results'
import type { ToolDefinition, ToolExecutionState, ToolInput, ToolResult, ToolRunContext } from './types'

// ============================================================
// State machine
// ============================================================

/**
 * The only valid transitions — components/tools/ToolPageShell.tsx drives
 * its state exclusively through nextState(), never a raw setState to an
 * arbitrary value, so an invalid transition (e.g. 'idle' straight to
 * 'success') can't happen by a future edit's oversight.
 */
const VALID_TRANSITIONS: Record<ToolExecutionState, ToolExecutionState[]> = {
  idle: ['validating'],
  validating: ['processing', 'error', 'idle'],
  processing: ['success', 'partial', 'error'],
  success: ['idle', 'validating'], // "run again"
  partial: ['idle', 'validating'],
  error: ['idle', 'validating'],
}

export function canTransition(from: ToolExecutionState, to: ToolExecutionState): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

/** Pure reducer — throws in development-shape (returns `from` unchanged, never crashes a page) if the transition isn't valid, so a bug shows as "stuck," not a white screen. */
export function nextState(from: ToolExecutionState, to: ToolExecutionState): ToolExecutionState {
  return canTransition(from, to) ? to : from
}

// ============================================================
// Orchestration
// ============================================================

export type RunToolOutcome =
  | { state: 'success' | 'partial'; result: ToolResult }
  | { state: 'error'; error: ReturnType<typeof toToolError> }

export interface RunToolValidationFailure {
  state: 'validation-error'
  validation: ValidationResult
  message: string
}

/**
 * Step 1 of running a tool: validate raw form input against its
 * declared inputFields. Kept separate from executeTool() below so
 * components/tools/ToolPageShell.tsx can show a validation error (state
 * 'error' via 'validating' → nowhere further) without ever calling the
 * tool's actual run() function on bad input.
 */
export function validateForTool(tool: ToolDefinition, rawInput: ToolInput): ValidationResult {
  return validateToolInput(tool.inputFields, rawInput)
}

export { summarizeValidationErrors }

/**
 * Step 2: calls the tool's own run() with already-validated input,
 * catching anything it throws (or a rejected promise) and normalizing it
 * into a ToolError rather than letting an unhandled exception reach the
 * page — the same "never let a provider's failure become an unhandled
 * exception" discipline lib/crm.ts (ADR-010) established for the CRM.
 */
export async function executeTool(tool: ToolDefinition, input: ToolInput, ctx: ToolRunContext): Promise<RunToolOutcome> {
  try {
    const result = await tool.run(input, ctx)
    // Trust the tool's own findings but re-derive overallStatus rather
    // than the tool's self-reported value, in case a tool author built
    // the ToolResult by hand instead of via lib/tools/results.ts
    // buildToolResult() — this keeps "a failed finding downgrades the
    // result" true even then.
    const overallStatus = computeOverallStatus(result.findings)
    if (overallStatus === 'success') return { state: 'success', result: { ...result, overallStatus } }
    return { state: 'partial', result: { ...result, overallStatus } }
  } catch (err) {
    return { state: 'error', error: toToolError(err) }
  }
}
