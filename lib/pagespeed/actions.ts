'use server'

import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { normalizeUrl } from '@/lib/validation'
import { makeToolError, TOOL_ERROR_CODES } from '@/lib/tools/errors'
import { buildToolResult } from '@/lib/tools/results'
import { toToolFinding, type Finding } from '@/lib/website-analyzer/types'
import { analyzeWebsiteForCategories } from '@/lib/website-analyzer/analyzer'
import { googlePageSpeedProvider } from './google-provider'
import { getCachedAnalysis, setCachedAnalysis } from './cache'
import { buildPageSpeedFindings } from './findings'
import type { PageSpeedAnalysis, PageSpeedProvider, PageSpeedStrategy } from './provider'
import type { ToolInput, ToolResult } from '@/lib/tools/types'

/**
 * The Server Action bridge for the Forge PageSpeed Test — the same
 * pattern lib/website-analyzer/actions.ts already established (a
 * `runWebsiteAnalyzerTool.bind()`-style Server Action is required
 * because the real work needs `node:dns`/`node:net`/an outbound fetch,
 * none of which can run in the browser).
 *
 * `PROVIDER` is the one line that would need to change to swap
 * providers — everything else in this file talks to the
 * `PageSpeedProvider` interface (lib/pagespeed/provider.ts), never to
 * Google specifically. See docs/tools.md "PageSpeedProvider" for the
 * full replaceability contract.
 */
const PROVIDER: PageSpeedProvider = googlePageSpeedProvider

// PSI lab runs are Google's own quota-metered, slow operation — a
// tighter limit than the generic website-analyzer tools' 10/10min
// (lib/website-analyzer/actions.ts), on purpose.
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }

async function getRateLimitKey(): Promise<string> {
  const h = await headers()
  const forwardedFor = h.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim()
  return ip || 'local-dev'
}

const STRATEGY: PageSpeedStrategy = 'mobile' // see lib/pagespeed/tool.ts's methodology copy for why this tool checks mobile only, not a mobile/desktop toggle, in this pass.

/** Internal Website Diagnostic Engine categories this tool reuses instead of asking Google's overlapping SEO category — exactly the list named in the brief: title, meta, viewport, schema, headings, HTTPS, image signals, mobile signals. */
const TECHNICAL_CATEGORIES = ['http', 'metadata', 'headings', 'schema', 'images', 'mobile'] as const

export interface PageSpeedToolResult {
  pagespeed: PageSpeedAnalysis
  pagespeedFindings: Finding[]
  technicalFindings: Finding[]
  cached: boolean
}

/**
 * The rich result the bespoke PageSpeed Test page (components/pagespeed/PageSpeedTool.tsx)
 * calls directly — kept separate from `runPageSpeedTool` below (the
 * generic-engine-compatible entry point) because the bespoke UI needs
 * PageSpeed findings and internal-engine findings as two distinct lists
 * (the brief's UX steps 5-6 vs. step 7), not one flat array.
 */
export async function getPageSpeedAnalysis(rawUrl: string): Promise<PageSpeedToolResult> {
  const rateLimitKey = await getRateLimitKey()
  if (!checkRateLimit(`pagespeed:${rateLimitKey}`, RATE_LIMIT).allowed) {
    throw makeToolError(TOOL_ERROR_CODES.RATE_LIMITED, 'Too many PageSpeed checks from this connection. Please try again in a few minutes.')
  }

  const normalized = normalizeUrl(rawUrl)
  if (!normalized) {
    throw makeToolError(TOOL_ERROR_CODES.VALIDATION_FAILED, 'Enter a valid website address (e.g. https://yourbusiness.com).')
  }

  const [pagespeedOutcome, technical] = await Promise.all([
    (async () => {
      const cached = getCachedAnalysis(normalized, STRATEGY)
      if (cached) return { analysis: cached, cached: true }
      if (!PROVIDER.isConfigured()) {
        const analysis: PageSpeedAnalysis = { status: 'unavailable', reason: 'not-configured' }
        return { analysis, cached: false }
      }
      const analysis = await PROVIDER.analyze(normalized, STRATEGY)
      setCachedAnalysis(normalized, STRATEGY, analysis)
      return { analysis, cached: false }
    })(),
    analyzeWebsiteForCategories(normalized, [...TECHNICAL_CATEGORIES]),
  ])

  return {
    pagespeed: pagespeedOutcome.analysis,
    pagespeedFindings: buildPageSpeedFindings(pagespeedOutcome.analysis),
    technicalFindings: technical.findings,
    cached: pagespeedOutcome.cached || technical.cached,
  }
}

/**
 * The generic-engine-compatible entry point — used as
 * `ToolDefinition.run` (lib/pagespeed/tool.ts) so this tool is a fully
 * valid, registry-consistent entry (relatedTools cross-links, sitemap
 * inclusion, `npm run test`'s cost-policy validation) even though its
 * real route (app/tools/page-speed-test/page.tsx, a static route that
 * takes precedence over the generic `/tools/[slug]`) renders the richer
 * bespoke UI via `getPageSpeedAnalysis` above instead of this flat
 * result.
 */
export async function runPageSpeedTool(input: ToolInput): Promise<ToolResult> {
  const rawUrl = typeof input.url === 'string' ? input.url : ''
  const result = await getPageSpeedAnalysis(rawUrl)
  const findings = [...result.pagespeedFindings, ...result.technicalFindings].map(toToolFinding)
  const goodCount = findings.filter((f) => f.severity === 'good').length
  return buildToolResult({
    toolSlug: 'page-speed-test',
    summary: result.pagespeed.status === 'ok' ? `${goodCount} of ${findings.length} checks look good.` : 'Live PageSpeed data was unavailable for this run — showing what we could still check.',
    findings,
    cached: result.cached,
  })
}
