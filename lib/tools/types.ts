/**
 * Type contract for the Forge Free Tools platform.
 *
 * These types exist to make a tool's cost shape a compile-time-checked
 * fact, not a comment someone has to remember to write. See
 * docs/tools-cost-policy.md for the policy these types encode, and
 * docs/tool-cost-matrix.md for how each real/candidate tool is
 * classified against them.
 *
 * Client-safe: no secrets, no server-only imports. lib/constants.ts's
 * TOOLS registry is typed against ToolDefinition below.
 */

// ============================================================
// Cost classification — docs/tools-cost-policy.md §A/§C
// ============================================================

/**
 * Cost bucket for a single data source or dependency a tool capability
 * relies on. PAID_NOT_ALLOWED exists so the policy validator
 * (lib/tools/cost-policy.ts) has something concrete to reject — no
 * shipped tool's dataSource should ever legitimately carry this value.
 * It is not a "discouraged" tier; it is a build error.
 */
export type ToolCostClassification =
  | 'FREE_INTERNAL' // our own TS/JS logic, deterministic, no network call
  | 'FREE_EXTERNAL_API' // a legitimate free-tier/no-key public API, used within its documented limits
  | 'CUSTOMER_AUTHORIZED' // the customer's own account/credentials/data, provided and used only with consent
  | 'PAID_NOT_ALLOWED' // any provider requiring a paid plan, card on file, or metered billing — forbidden
  | 'UNAVAILABLE' // no zero-cost way to source this exists today; the capability is honestly absent, not faked

/**
 * How a tool, as a whole, sources the capability it offers. Mirrors
 * ToolCostClassification at the tool level, plus 'future-paid' for a
 * tool that is designed but deliberately not built because doing it
 * properly would require a paid dependency — see
 * docs/tools-cost-policy.md §J for the conditions under which that could
 * change.
 */
export type ToolAvailability =
  | 'free'
  | 'customer-authorized'
  | 'external-free-api'
  | 'unavailable'
  | 'future-paid'

/**
 * Whether a tool can currently be used. A 'future-paid' tool must NEVER
 * be 'available' — the UI must not imply a tool is usable today when it
 * actually depends on a dependency we've deliberately not added.
 * Enforced by validateToolDefinition() in lib/tools/cost-policy.ts.
 */
export type ToolStatus = 'available' | 'planned' | 'unavailable' | 'future-paid'

// ============================================================
// Data sources, capabilities, cost/security profiles
// ============================================================

export interface ToolDataSource {
  /** Stable id, e.g. 'internal-heuristics', 'gbp-self-report'. */
  id: string
  /** Human-readable name of the source or provider. */
  name: string
  costClassification: ToolCostClassification
  /** What this actually is and where it comes from — cite the free tier/limit if external. */
  description: string
  requiresApiKey: boolean
  /** Required whenever requiresApiKey is true — makes a stray key obvious in review, never hard-coded. */
  apiKeyEnvVar?: string
  /** Link to the provider's current terms/rate-limit page, for external-free-api sources. */
  officialDocsUrl?: string
  rateLimitNotes?: string
}

export interface ToolCapability {
  id: string
  label: string
  description: string
  dataSource: ToolDataSource
}

export interface ToolCostProfile {
  classification: ToolCostClassification
  /** 0 for anything zero-cost; the literal string flags a free-tier dependency worth re-checking periodically. */
  monthlyCostEstimateUsd: 0 | 'variable-free-tier-only'
  notes: string
}

export interface ToolSecurityPolicy {
  /** True if the tool ever fetches a URL the visitor supplied (GBP link, website URL, etc.) — triggers SSRF review. */
  acceptsUserSuppliedUrl: boolean
  /** Required, non-empty, whenever acceptsUserSuppliedUrl is true. See docs/tools-cost-policy.md §H. */
  ssrfMitigation: string
  /** Human-readable rate-limit rule actually enforced for this tool (e.g. "5 requests / 10 min / IP-ish key"). */
  rateLimitPerIp: string
  /** What input validation is applied before any data is used or stored. */
  inputValidation: string
  /** What is retained after a run, for how long, and where. 'none' is a valid, preferred answer. */
  dataRetention: string
}

// ============================================================
// Input/output shapes
// ============================================================

/** Deliberately open — each tool narrows this with its own input shape. */
export interface ToolInput {
  [field: string]: unknown
}

export type ToolFindingSeverity = 'info' | 'good' | 'warning' | 'critical'

export interface ToolFinding {
  id: string
  label: string
  severity: ToolFindingSeverity
  detail: string
  /** Optional link into the relevant Forge page (audit, a website tier, maintenance) — never a bare "buy now". */
  recommendationHref?: string
}

export interface ToolError {
  code: string
  message: string
  retryable: boolean
}

export interface ToolResult {
  toolSlug: string
  generatedAt: string
  /** True when served from cache rather than freshly computed — see docs/tools-cost-policy.md §F. */
  cached: boolean
  summary: string
  findings: ToolFinding[]
  error?: ToolError
}

// ============================================================
// The tool definition itself
// ============================================================

export interface ToolDefinition {
  slug: string
  name: string
  description: string
  status: ToolStatus
  availability: ToolAvailability
  costProfile: ToolCostProfile
  /** Every real capability's data source, declared explicitly — never inferred or left implicit. */
  dataSources: ToolDataSource[]
  capabilities: ToolCapability[]
  securityPolicy: ToolSecurityPolicy
}
