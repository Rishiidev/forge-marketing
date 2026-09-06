/**
 * Zero-cost policy enforcement — the developer-facing mechanism that
 * makes an accidental paid dependency obvious, per
 * docs/tools-cost-policy.md.
 *
 * Two independent checks live here, both exercised by
 * lib/tools/__tests__/cost-policy.test.ts on every run:
 *
 * 1. findForbiddenDependencies() — scans package.json for named paid
 *    providers. Catches "an API key exists, so someone added the SDK"
 *    before it ships, regardless of whether any tool references it yet.
 * 2. validateToolDefinition() — checks a single ToolDefinition's
 *    metadata is complete, its data sources are honestly classified, and
 *    a future-paid tool is never marked available.
 *
 * Client-safe: no secrets, no server-only import — this module only
 * reads plain objects it's given.
 */

import type { ToolDefinition } from './types'

// ============================================================
// A. Approved dependency categories — docs/tools-cost-policy.md §B
// ============================================================

export const APPROVED_DEPENDENCY_CATEGORIES = [
  'Own TypeScript/JavaScript logic (deterministic analysis, scoring, heuristics)',
  'Browser/Web platform APIs (fetch, Intl, Canvas, etc. — no vendor, no key)',
  'Node.js/Next.js server capabilities already in the stack (Route Handlers, Server Actions, fs)',
  'Legitimate free-tier or no-key public APIs, used within their documented, published limits',
  'Customer-authorized integrations (the customer supplies their own account/credentials, used only with explicit consent)',
  'Static/MDX content shipped in this repository',
  'In-process or file-backed caching (no paid cache/CDN service)',
  'Open-source npm packages with no paid tier requirement for the functionality actually used',
] as const

// ============================================================
// C. Forbidden paid dependencies — docs/tools-cost-policy.md §C
//
// Named explicitly (OpenAI, Anthropic, Ahrefs, Semrush, DataForSEO,
// SerpApi, BrightLocal, Moz) plus a small set of adjacent SEO/AI/data
// vendors with the same shape (paid API, no usable free tier for this
// kind of tool). This list is a safety net, not the whole policy — see
// docs/tools-cost-policy.md §C for the standing rule that governs
// packages this list doesn't happen to name yet.
// ============================================================

export const FORBIDDEN_PACKAGE_PATTERNS: RegExp[] = [
  /^openai$/i,
  /^@anthropic-ai\//i,
  /ahrefs/i,
  /semrush/i,
  /dataforseo/i,
  /serpapi/i,
  /brightlocal/i,
  /^moz(-api)?$/i,
  /majestic/i,
  /spyfu/i,
  /^similarweb/i,
  /^ubersuggest/i,
  /^clearbit/i,
  /^fullcontact/i,
]

interface PackageJsonShape {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Returns the list of dependency names (from either dependencies or
 * devDependencies) that match a known-paid-provider pattern. Empty
 * result is the only passing state — see the test that calls this
 * against the repo's real package.json on every run.
 */
export function findForbiddenDependencies(pkg: PackageJsonShape): string[] {
  const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]
  return names.filter((name) => FORBIDDEN_PACKAGE_PATTERNS.some((pattern) => pattern.test(name)))
}

// ============================================================
// Per-tool metadata validation
// ============================================================

/**
 * Returns a list of policy violations for one tool. Empty array = passes.
 * Checked for every entry in lib/constants.ts TOOLS by
 * lib/tools/__tests__/cost-policy.test.ts.
 */
export function validateToolDefinition(tool: ToolDefinition): string[] {
  const issues: string[] = []
  const ref = tool.slug || tool.name || '(unnamed tool)'

  if (!tool.slug) issues.push(`${ref}: missing slug`)
  if (!tool.name) issues.push(`${ref}: missing name`)
  if (!tool.description) issues.push(`${ref}: missing description`)

  if (!tool.securityPolicy) {
    issues.push(`${ref}: missing securityPolicy`)
  } else {
    if (tool.securityPolicy.acceptsUserSuppliedUrl && !tool.securityPolicy.ssrfMitigation) {
      issues.push(`${ref}: acceptsUserSuppliedUrl is true but ssrfMitigation is not documented`)
    }
    if (!tool.securityPolicy.rateLimitPerIp) {
      issues.push(`${ref}: securityPolicy.rateLimitPerIp is not documented`)
    }
    if (!tool.securityPolicy.dataRetention) {
      issues.push(`${ref}: securityPolicy.dataRetention is not documented`)
    }
  }

  if (!tool.dataSources || tool.dataSources.length === 0) {
    issues.push(`${ref}: no dataSources declared`)
  } else {
    for (const ds of tool.dataSources) {
      if (ds.costClassification === 'PAID_NOT_ALLOWED') {
        issues.push(`${ref}: dataSource "${ds.name}" is classified PAID_NOT_ALLOWED — forbidden, remove or replace it`)
      }
      if (ds.requiresApiKey && !ds.apiKeyEnvVar) {
        issues.push(`${ref}: dataSource "${ds.name}" requiresApiKey but declares no apiKeyEnvVar`)
      }
    }
  }

  if (!tool.capabilities || tool.capabilities.length === 0) {
    issues.push(`${ref}: no capabilities declared`)
  }

  if (tool.availability === 'future-paid' && tool.status === 'available') {
    issues.push(`${ref}: availability is 'future-paid' but status is 'available' — a future-paid tool must never appear available`)
  }

  if (!tool.costProfile) {
    issues.push(`${ref}: missing costProfile`)
  } else if (tool.costProfile.classification === 'PAID_NOT_ALLOWED') {
    issues.push(`${ref}: costProfile.classification is PAID_NOT_ALLOWED — forbidden`)
  }

  return issues
}
