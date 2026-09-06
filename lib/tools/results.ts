/**
 * Result-building helpers — the concrete enforcement of the honesty
 * contract behind ToolResultCategory (lib/tools/types.ts): a tool author
 * calls one of the five named builders below, never constructs a
 * ToolFinding by hand with a bare string for `resultCategory`. This
 * makes "inferred data presented as verified" a code-review-visible
 * choice (which builder was called) instead of a typo one field away
 * from the wrong label.
 *
 * CRITICAL, per the standing instruction this module encodes: never
 * call verifiedFinding() for something the tool didn't itself directly
 * confirm. A self-report answer, a heuristic, or an estimate is always
 * inferredFinding() — see lib/tools/__tests__/results.test.ts.
 *
 * Client-safe: no secrets, no server-only import — findings are built
 * the same way whether a tool runs client-side (like lib/audit.ts) or
 * server-side.
 */

import type { ToolFinding, ToolFindingSeverity, ToolResult } from './types'

interface FindingInput {
  id: string
  label: string
  detail: string
  severity?: ToolFindingSeverity
  recommendationHref?: string
  whyItMatters?: string
  recommendedAction?: string
  technicalDetails?: Record<string, string | number | boolean | null>
}

function build(resultCategory: ToolFinding['resultCategory'], defaultSeverity: ToolFindingSeverity) {
  return (input: FindingInput): ToolFinding => ({
    id: input.id,
    label: input.label,
    detail: input.detail,
    severity: input.severity ?? defaultSeverity,
    recommendationHref: input.recommendationHref,
    whyItMatters: input.whyItMatters,
    recommendedAction: input.recommendedAction,
    technicalDetails: input.technicalDetails,
    resultCategory,
  })
}

/** The tool directly confirmed this fact itself (e.g. it fetched the homepage and saw the tag). */
export const verifiedFinding = build('verified', 'good')

/** Derived from a heuristic, self-report answer, or indirect signal — plausible, never presented as confirmed. */
export const inferredFinding = build('inferred', 'info')

/** No zero-cost way exists to check this. Honestly absent — never a guess, never silently omitted either. */
export const unavailableFinding = build('unavailable', 'info')

/** In scope for this tool but this particular run didn't check it (e.g. an optional field the visitor skipped). */
export const notCheckedFinding = build('not_checked', 'info')

/** The check was attempted and errored — distinct from unavailable, which never attempts. Drives overallStatus: 'partial'. */
export const failedFinding = build('failed', 'warning')

/**
 * Rolls a finding list up into a result-level status. A 'failed' finding
 * makes the whole result 'partial' (some real content still rendered —
 * see docs/tool-architecture.md's idle/validating/processing/success/
 * partial/error state machine); an honest 'unavailable'/'not_checked'
 * finding is not a failure and does not downgrade the result.
 */
export function computeOverallStatus(findings: ToolFinding[]): ToolResult['overallStatus'] {
  if (findings.length === 0) return 'success'
  return findings.some((f) => f.resultCategory === 'failed') ? 'partial' : 'success'
}

export interface BuildToolResultInput {
  toolSlug: string
  summary: string
  findings: ToolFinding[]
  cached?: boolean
}

/** Assembles the final ToolResult a tool's run() function returns. */
export function buildToolResult({ toolSlug, summary, findings, cached = false }: BuildToolResultInput): ToolResult {
  return {
    toolSlug,
    generatedAt: new Date().toISOString(),
    cached,
    summary,
    findings,
    overallStatus: computeOverallStatus(findings),
  }
}

/** Count of findings per resultCategory — feeds components/tools/ToolScore.tsx. */
export function summarizeByCategory(findings: ToolFinding[]): Record<ToolFinding['resultCategory'], number> {
  const counts: Record<ToolFinding['resultCategory'], number> = {
    verified: 0,
    inferred: 0,
    unavailable: 0,
    not_checked: 0,
    failed: 0,
  }
  for (const f of findings) counts[f.resultCategory] += 1
  return counts
}
