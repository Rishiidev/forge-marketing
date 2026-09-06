'use server'

import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { normalizeUrl } from '@/lib/validation'
import { makeToolError, TOOL_ERROR_CODES } from '@/lib/tools/errors'
import { buildToolResult } from '@/lib/tools/results'
import { toToolFinding, type FindingCategory } from './types'
import { analyzeWebsiteForCategories } from './analyzer'
import type { ToolInput, ToolResult } from '@/lib/tools/types'

/**
 * The Server Action bridge every website-analyzer `ToolDefinition.run()`
 * (lib/website-analyzer/tools.ts) calls. Exists because the real
 * analysis needs `node:dns`/`node:net` (lib/tools/security.ts,
 * `server-only`) to do its SSRF checks — those can never run in the
 * browser, so `run()` can't be a plain client-side pure function the
 * way lib/audit.ts's is. A Server Action, imported into
 * components/tools/ToolPageShell.tsx (a Client Component) and called
 * like a normal async function, is the supported Next.js pattern for
 * exactly this — the framework generates the client/server RPC
 * plumbing; no fetch()/API route was hand-written for it.
 *
 * Rate-limited the same way app/actions.ts's lead-capture actions
 * already are (same `checkRateLimit`/IP-derivation pattern) — fetching
 * an external site is more expensive than accepting a form POST, so the
 * limit here is deliberately tighter.
 */

const RATE_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 }

async function getRateLimitKey(): Promise<string> {
  const h = await headers()
  const forwardedFor = h.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim()
  return ip || 'local-dev'
}

const CATEGORY_SUMMARY_LABEL: Record<FindingCategory, string> = {
  http: 'server response',
  metadata: 'page metadata',
  headings: 'heading structure',
  links: 'links',
  images: 'images',
  schema: 'structured data',
  robots: 'robots.txt',
  sitemap: 'sitemap.xml',
  'security-headers': 'security headers',
  mobile: 'mobile-friendliness',
  'local-signals': 'business information',
  content: 'page content',
  social: 'social links',
}

function summarize(categories: FindingCategory[], counts: { good: number; warning: number; critical: number; total: number }): string {
  const label = categories.length === 1 ? CATEGORY_SUMMARY_LABEL[categories[0]!] : 'website'
  if (counts.total === 0) return `We checked your ${label} and found nothing to report.`
  const problems = counts.warning + counts.critical
  if (problems === 0) return `We checked ${counts.total} things about your ${label} — everything looks good.`
  return `We checked ${counts.total} things about your ${label} — ${problems} worth a look, ${counts.good} already look good.`
}

/**
 * `toolSlug` + `categories` (+ optional `idPrefixes`, for the two tools
 * that need a finer slice of one category — meta-checker vs.
 * open-graph-checker both live in the 'metadata' category) together
 * describe one of the 12 focused tools
 * (lib/website-analyzer/tools.ts `WEBSITE_ANALYZER_TOOLS`) — this
 * function itself has no per-tool branching beyond that; every tool
 * calls the exact same code path.
 *
 * `input` is deliberately the *last* parameter, not the first: each
 * `ToolDefinition.run` (lib/website-analyzer/tools.ts) is
 * `runWebsiteAnalyzerTool.bind(null, slug, categories, idPrefixes)` — a
 * bound Server Action reference, the standard Next.js pattern for a
 * parameterized Server Action (the same shape as `action.bind(null,
 * id)` in a form). A plain arrow-function wrapper around this call
 * (`(input) => runWebsiteAnalyzerTool(slug, categories, input)`) does
 * NOT work here and was tried first — Next's RSC serializer rejects an
 * ordinary closure that merely *calls* a Server Action, since only the
 * action reference itself (bound or not) is a recognized serializable
 * value when passed from a Server Component into a Client Component
 * (app/tools/[slug]/page.tsx → components/tools/ToolPageShell.tsx).
 */
export async function runWebsiteAnalyzerTool(toolSlug: string, categories: FindingCategory[], idPrefixes: string[] | undefined, input: ToolInput): Promise<ToolResult> {
  const rateLimitKey = await getRateLimitKey()
  if (!checkRateLimit(`website-analyzer:${rateLimitKey}`, RATE_LIMIT).allowed) {
    throw makeToolError(TOOL_ERROR_CODES.RATE_LIMITED, 'Too many checks from this connection. Please try again in a few minutes.')
  }

  const rawUrl = typeof input.url === 'string' ? input.url : ''
  const normalized = normalizeUrl(rawUrl)
  if (!normalized) {
    throw makeToolError(TOOL_ERROR_CODES.VALIDATION_FAILED, 'Enter a valid website address (e.g. https://yourbusiness.com).')
  }

  const { findings, cached } = await analyzeWebsiteForCategories(normalized, categories)
  const scoped = idPrefixes ? findings.filter((f) => idPrefixes.some((prefix) => f.id.startsWith(prefix))) : findings
  const toolFindings = scoped.map(toToolFinding)

  const counts = { good: 0, warning: 0, critical: 0, total: toolFindings.length }
  for (const f of toolFindings) {
    if (f.severity === 'good') counts.good += 1
    else if (f.severity === 'warning') counts.warning += 1
    else if (f.severity === 'critical') counts.critical += 1
  }

  return buildToolResult({ toolSlug, summary: summarize(categories, counts), findings: toolFindings, cached })
}
