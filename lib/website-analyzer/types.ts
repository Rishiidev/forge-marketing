/**
 * Shared types for the Forge Website Diagnostic engine — one reusable
 * homepage analysis that produces a flat list of normalized `Finding`s,
 * which every `/tools/*-checker` page (lib/website-analyzer/tools.ts)
 * filters down to its own category rather than re-running any analysis
 * logic. See lib/website-analyzer/analyzer.ts for the orchestrator.
 *
 * `Finding` is deliberately richer than the generic engine's
 * `ToolFinding` (lib/tools/types.ts) — it's the domain-specific shape
 * every check module below builds, then `toToolFinding()` (this file)
 * normalizes it down to the generic shape every existing engine
 * component (ToolFinding.tsx, ToolResult.tsx, ...) already knows how to
 * render. One deviation, logged rather than silent, matching this
 * project's own ADR-002 convention for a small, justified addition
 * beyond a brief's literal file list.
 *
 * Client-safe: no secrets, no server-only import.
 */

import type { ToolFinding, ToolFindingSeverity, ToolResultCategory } from '@/lib/tools/types'

export type FindingSeverity = ToolFindingSeverity

export type FindingCategory =
  | 'http'
  | 'metadata'
  | 'headings'
  | 'links'
  | 'images'
  | 'schema'
  | 'robots'
  | 'sitemap'
  | 'security-headers'
  | 'mobile'
  | 'local-signals'
  | 'content'
  | 'social'

/**
 * How sure the engine actually is. Distinct, deliberately smaller
 * vocabulary than ToolResultCategory's five values — `verified` means
 * the engine directly confirmed the fact itself (fetched the page and
 * saw it), `heuristic` means a pattern-matched estimate (never claimed
 * as confirmed), `unavailable` means no zero-cost way exists to check
 * it at all. See "Do not claim schema is valid merely because JSON
 * parses" and the parallel rules for every other category — this field
 * is the mechanism, not just a comment.
 */
export type FindingConfidence = 'verified' | 'heuristic' | 'unavailable'

/**
 * Per-check outcome vocabulary. Not every value applies to every
 * category — schema.ts uses FOUND/PARSED/POTENTIALLY_INVALID/NOT_FOUND
 * exactly as required; most other categories use PASS/FAIL/PARTIAL;
 * ERROR marks a check that was attempted but genuinely failed to run
 * (a timeout, an unreachable robots.txt) — distinct from NOT_FOUND
 * (checked, and the thing genuinely isn't there).
 */
export type FindingStatus = 'FOUND' | 'NOT_FOUND' | 'PARSED' | 'POTENTIALLY_INVALID' | 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_APPLICABLE' | 'ERROR'

export type EvidenceValue = string | number | boolean | null | undefined
export interface Evidence {
  [key: string]: EvidenceValue | EvidenceValue[]
}

export interface Finding {
  id: string
  category: FindingCategory
  severity: FindingSeverity
  title: string
  /** Plain language, one or two sentences — no jargon. */
  whatWeFound: string
  /** Plain language — the consequence for the visitor's business, not a technical explanation. */
  whyItMatters: string
  /** Plain language, actionable — what the visitor (or Forge) should actually do next. */
  recommendedAction: string
  /** Raw, technical values — rendered behind a collapsed "technical details" disclosure, never in the main text. */
  evidence: Evidence
  confidence: FindingConfidence
  status: FindingStatus
}

function stringifyEvidence(evidence: Evidence): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(evidence)) {
    if (value === undefined) continue
    out[key] = Array.isArray(value) ? value.join(', ') : value
  }
  return out
}

function confidenceToResultCategory(finding: Finding): ToolResultCategory {
  if (finding.status === 'ERROR') return 'failed'
  if (finding.confidence === 'verified') return 'verified'
  if (finding.confidence === 'heuristic') return 'inferred'
  return 'unavailable'
}

/**
 * The one, single place a domain `Finding` becomes a generic
 * `ToolFinding` — every category module returns `Finding[]`;
 * lib/website-analyzer/analyzer.ts calls this once per finding when
 * assembling the final `ToolResult`. Never call this per-tool or
 * per-page — that would be the exact "duplicate analysis logic" the
 * brief for this engine explicitly rules out.
 */
export function toToolFinding(finding: Finding): ToolFinding {
  return {
    id: finding.id,
    label: finding.title,
    severity: finding.severity,
    resultCategory: confidenceToResultCategory(finding),
    detail: finding.whatWeFound,
    whyItMatters: finding.whyItMatters,
    recommendedAction: finding.recommendedAction,
    technicalDetails: { status: finding.status, ...stringifyEvidence(finding.evidence) },
  }
}
