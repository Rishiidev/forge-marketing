import 'server-only'
import { safeFetch, AUXILIARY_FETCH_OPTIONS } from './security'
import type { Finding } from './types'

/** CHECK §7: fetch /robots.txt (a real, bounded, second fetch — never following anything it references beyond noting the sitemap declarations). */

export interface RobotsEvidence {
  exists: boolean
  accessible: boolean
  hasUserAgentLine: boolean
  hasDisallowLine: boolean
  sitemapDeclarations: string[]
  /** True only when the fetch itself couldn't be completed (timeout, SSRF-blocked, unreachable) — distinct from a clean 404 ("exists: false, accessible: true"). */
  fetchFailed: boolean
}

export async function fetchRobotsTxt(siteOrigin: string): Promise<RobotsEvidence> {
  const empty = { exists: false, accessible: false, hasUserAgentLine: false, hasDisallowLine: false, sitemapDeclarations: [] }

  let url: string
  try {
    url = new URL('/robots.txt', siteOrigin).toString()
  } catch {
    return { ...empty, fetchFailed: true }
  }

  try {
    const result = await safeFetch(url, AUXILIARY_FETCH_OPTIONS)

    if (result.status === 404) {
      return { ...empty, exists: false, accessible: true, fetchFailed: false }
    }
    if (result.status < 200 || result.status >= 300) {
      return { ...empty, exists: true, accessible: false, fetchFailed: false }
    }

    const lines = result.body.split(/\r?\n/)
    const hasUserAgentLine = lines.some((line) => /^user-agent:/i.test(line.trim()))
    const hasDisallowLine = lines.some((line) => /^disallow:/i.test(line.trim()))
    const sitemapDeclarations = lines.filter((line) => /^sitemap:/i.test(line.trim())).map((line) => line.trim().replace(/^sitemap:\s*/i, ''))

    return { exists: true, accessible: true, hasUserAgentLine, hasDisallowLine, sitemapDeclarations, fetchFailed: false }
  } catch {
    // A timeout, SSRF block, or unreachable host — a genuine "we
    // couldn't check this," not "this doesn't exist." See
    // lib/website-analyzer/types.ts's status: 'ERROR' — this is what
    // maps to a 'failed' resultCategory (and overallStatus: 'partial')
    // in the generic engine, rather than being silently folded into
    // "not found."
    return { ...empty, fetchFailed: true }
  }
}

export function buildRobotsFindings(evidence: RobotsEvidence): Finding[] {
  if (evidence.fetchFailed) {
    return [
      {
        id: 'robots-txt',
        category: 'robots',
        severity: 'info',
        title: 'robots.txt',
        whatWeFound: "We couldn't check your robots.txt file right now (the request timed out or the site didn't respond).",
        whyItMatters: 'robots.txt tells search engine crawlers which parts of your site they may access.',
        recommendedAction: 'Try running this check again in a moment.',
        evidence: {},
        confidence: 'unavailable',
        status: 'ERROR',
      },
    ]
  }

  if (!evidence.exists) {
    return [
      {
        id: 'robots-txt',
        category: 'robots',
        severity: 'info',
        title: 'robots.txt',
        whatWeFound: 'Your site has no robots.txt file.',
        whyItMatters: "This isn't required — without one, search engines assume they can crawl everything, which is the right default for most small business sites.",
        recommendedAction: "Optional: add a robots.txt if you ever need to keep a specific section (e.g. an admin area) out of search engines.",
        evidence: {},
        confidence: 'verified',
        status: 'NOT_FOUND',
      },
    ]
  }

  const findings: Finding[] = []

  findings.push({
    id: 'robots-txt',
    category: 'robots',
    severity: evidence.accessible ? 'good' : 'warning',
    title: 'robots.txt',
    whatWeFound: evidence.accessible ? 'Your site has a robots.txt file, and it loaded successfully.' : 'Your site has a robots.txt file, but it did not load successfully.',
    whyItMatters: evidence.accessible ? 'Search engines can read your crawling rules normally.' : 'If search engines cannot read this file reliably, they may fall back to more conservative (or unpredictable) crawling behavior.',
    recommendedAction: evidence.accessible ? 'Nothing to do here.' : 'Check that /robots.txt returns a normal 200 response.',
    evidence: {},
    confidence: 'verified',
    status: evidence.accessible ? 'PASS' : 'FAIL',
  })

  if (evidence.accessible) {
    findings.push({
      id: 'robots-syntax',
      category: 'robots',
      severity: evidence.hasUserAgentLine ? 'good' : 'warning',
      title: 'robots.txt syntax',
      whatWeFound: evidence.hasUserAgentLine ? 'Your robots.txt has at least one recognizable "User-agent:" line.' : 'Your robots.txt does not appear to have a "User-agent:" line — it may not be valid robots.txt syntax.',
      whyItMatters: 'A robots.txt without a recognizable User-agent line may be ignored or misread by crawlers.',
      recommendedAction: evidence.hasUserAgentLine ? 'Nothing to do here.' : 'Check the file follows the standard robots.txt format (e.g. "User-agent: *" followed by Allow/Disallow rules).',
      evidence: { hasDisallowLine: evidence.hasDisallowLine },
      confidence: 'verified',
      status: evidence.hasUserAgentLine ? 'PASS' : 'FAIL',
    })

    findings.push({
      id: 'robots-sitemap-declaration',
      category: 'robots',
      severity: evidence.sitemapDeclarations.length > 0 ? 'good' : 'info',
      title: 'Sitemap declared in robots.txt',
      whatWeFound:
        evidence.sitemapDeclarations.length > 0
          ? `Your robots.txt declares ${evidence.sitemapDeclarations.length} sitemap${evidence.sitemapDeclarations.length > 1 ? 's' : ''}: ${evidence.sitemapDeclarations.join(', ')}.`
          : 'Your robots.txt does not declare a sitemap.',
      whyItMatters: 'Declaring your sitemap here is the standard way search engines discover it automatically, without you submitting it by hand.',
      recommendedAction: evidence.sitemapDeclarations.length > 0 ? 'Nothing to do here.' : 'Add a line like "Sitemap: https://yourdomain.com/sitemap.xml" to your robots.txt.',
      evidence: { sitemapDeclarations: evidence.sitemapDeclarations },
      confidence: 'verified',
      status: evidence.sitemapDeclarations.length > 0 ? 'FOUND' : 'NOT_FOUND',
    })
  }

  return findings
}
