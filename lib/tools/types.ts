/**
 * Type contract for the Forge Free Tools platform — both the zero-cost
 * policy shape (established first, docs/tools-cost-policy.md) and the
 * reusable tools *engine* built on top of it (docs/tool-architecture.md).
 *
 * Client-safe: no secrets, no server-only imports. lib/constants.ts's
 * TOOLS registry and lib/tools/registry.ts are typed against
 * ToolDefinition below.
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
  /** Required, non-empty, whenever acceptsUserSuppliedUrl is true. See docs/tools-cost-policy.md §H / docs/tool-security.md. */
  ssrfMitigation: string
  /** Human-readable rate-limit rule actually enforced for this tool (e.g. "5 requests / 10 min / IP-ish key"). */
  rateLimitPerIp: string
  /** What input validation is applied before any data is used or stored. */
  inputValidation: string
  /** What is retained after a run, for how long, and where. 'none' is a valid, preferred answer. */
  dataRetention: string
}

// ============================================================
// Result categories — the honesty contract. See lib/tools/results.ts.
//
// CRITICAL: a finding's resultCategory is never chosen for effect. A
// self-reported or heuristically-inferred fact is 'inferred', never
// 'verified' — 'verified' is reserved for something the tool actually
// confirmed directly (e.g. it fetched the page itself and saw the tag).
// lib/tools/__tests__/results.test.ts enforces this distinction exists
// in code, not just in this comment.
// ============================================================

export type ToolResultCategory =
  | 'verified' // the tool directly confirmed this fact itself
  | 'inferred' // derived from a heuristic, self-report, or indirect signal — plausible, not confirmed
  | 'unavailable' // no zero-cost way exists to check this — honestly absent, never guessed
  | 'not_checked' // in scope but this run didn't check it (e.g. visitor skipped an optional field)
  | 'failed' // the check was attempted and errored out — distinct from 'unavailable' (which never attempts)

export type ToolFindingSeverity = 'info' | 'good' | 'warning' | 'critical'

export interface ToolFinding {
  id: string
  label: string
  severity: ToolFindingSeverity
  /** See the CRITICAL note above — set by lib/tools/results.ts builders, never inferred implicitly by a component. */
  resultCategory: ToolResultCategory
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
  /** Derived from findings by lib/tools/results.ts — 'partial' when any finding is 'failed', 'success' otherwise (an honest 'unavailable'/'not_checked' finding is not a failure). */
  overallStatus: 'success' | 'partial' | 'failed'
  error?: ToolError
}

// ============================================================
// Execution state machine — see lib/tools/execution.ts
// ============================================================

export type ToolExecutionState = 'idle' | 'validating' | 'processing' | 'success' | 'partial' | 'error'

export interface ToolAttribution {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  landingPage?: string
  referrer?: string
}

export interface ToolRunContext {
  attribution: ToolAttribution
  /** Best-effort per-visitor key for rate limiting/caching, mirroring app/actions.ts's getRateLimitKey() pattern. Absent when a tool runs fully client-side with no server hop. */
  rateLimitKey?: string
}

/** Deliberately open — each tool narrows this with its own input shape, validated against its own `inputFields`. */
export interface ToolInput {
  [field: string]: unknown
}

/**
 * A tool's own analysis function. May run entirely client-side (pure,
 * synchronous-feeling, like lib/audit.ts) or call out to a server-side
 * Route Handler/Server Action that itself uses lib/tools/security.ts's
 * safeFetch() — the engine does not force one shape. What it *does*
 * force: the return value is always a real ToolResult, built through
 * lib/tools/results.ts so every finding carries an honest
 * resultCategory.
 */
export type ToolRunFn = (input: ToolInput, ctx: ToolRunContext) => Promise<ToolResult> | ToolResult

// ============================================================
// Input field schema — drives components/tools/ToolInput.tsx and
// lib/tools/validation.ts generically, so a new tool needs only to
// declare its fields, not build a form.
// ============================================================

export type ToolInputFieldType = 'text' | 'url' | 'email' | 'select' | 'textarea'

export interface ToolInputFieldOption {
  value: string
  label: string
}

export interface ToolInputFieldDefinition {
  id: string
  label: string
  type: ToolInputFieldType
  required: boolean
  placeholder?: string
  helpText?: string
  /** Hard cap enforced by lib/tools/validation.ts — see docs/tools-cost-policy.md §G "input size and shape limits". */
  maxLength?: number
  /** Required, non-empty, when type is 'select'. */
  options?: ToolInputFieldOption[]
}

// ============================================================
// Category, intent, CTA, SEO, FAQ
// ============================================================

export type ToolCategory = 'seo' | 'local-seo' | 'performance' | 'conversion' | 'content' | 'technical' | 'business-basics'

export const TOOL_CATEGORY_LABEL: Record<ToolCategory, string> = {
  seo: 'SEO',
  'local-seo': 'Local SEO',
  performance: 'Performance',
  conversion: 'Conversion',
  content: 'Content',
  technical: 'Technical',
  'business-basics': 'Business basics',
}

/**
 * A tool's contextual call to action — never a generic upsell. Each
 * tool declares its own, tied to what it actually found (see
 * docs/tool-architecture.md "Contextual CTA") — e.g. an SEO tool asks
 * "Want us to fix this?", a performance tool asks "Want a faster
 * site?", both pointing at whatever's actually relevant, never the same
 * one-size-fits-all pitch. `location` feeds lib/tools/analytics.ts's
 * tool_cta_clicked event, matching the `location` tag TrackedCtaLink
 * already uses site-wide.
 */
export interface ToolCtaDefinition {
  /** The question, e.g. "Want us to fix this?" — distinct from the button's own label. */
  headline: string
  /** One supporting sentence under the headline. */
  description: string
  /** The button's own text, e.g. AUDIT_CTA_LABEL ("Get your free audit") — never a generic "Learn more". */
  label: string
  href: string
  location: string
}

export interface ToolSeoMetadata {
  title: string
  description: string
  ogImage?: string
}

export interface ToolFaqItem {
  question: string
  answer: string
}

// ============================================================
// The tool definition itself
// ============================================================

export interface ToolDefinition {
  slug: string
  name: string
  /** One line — used on ToolCard/ToolGrid/RelatedTools and as a metadata fallback. */
  shortDescription: string
  /** Longer copy for the tool's own header/intro — may repeat and extend shortDescription. */
  description: string
  category: ToolCategory
  /** One sentence, visitor's-eye view: what problem this solves for them, not what it technically does. */
  intent: string
  /** The overall shape of what this tool needs from the visitor. */
  inputType: 'url' | 'form' | 'business-profile'
  /** Drives components/tools/ToolInput.tsx and lib/tools/validation.ts. */
  inputFields: ToolInputFieldDefinition[]
  run: ToolRunFn
  status: ToolStatus
  availability: ToolAvailability
  costProfile: ToolCostProfile
  /** Every real capability's data source, declared explicitly — never inferred or left implicit. */
  dataSources: ToolDataSource[]
  capabilities: ToolCapability[]
  securityPolicy: ToolSecurityPolicy
  seo: ToolSeoMetadata
  /** Slugs of other tools worth showing next to this one — resolved via lib/tools/registry.ts getRelatedTools(). */
  relatedTools: string[]
  primaryCTA: ToolCtaDefinition
  secondaryCTA?: ToolCtaDefinition
  faq?: ToolFaqItem[]
  /** Plain-language "how this works" copy, shown alongside the honest data-source list in components/tools/ToolMethodology.tsx. */
  methodology?: string
}
