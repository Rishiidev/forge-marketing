import 'server-only'
import crypto from 'node:crypto'
import { readStore, writeStore } from '@/lib/file-store'
import { fetchHomepage, buildHttpFindings } from './fetcher'
import { parseHtml } from './html-parser'
import { extractMetadata, buildMetadataFindings } from './metadata'
import { extractHeadings, buildHeadingsFindings } from './headings'
import { extractLinks, summarizeLinks, checkLinkReachability, buildLinksFindings } from './links'
import { extractImages, summarizeImages, buildImagesFindings } from './images'
import { extractSchema, buildSchemaFindings } from './schema'
import { fetchRobotsTxt, buildRobotsFindings } from './robots'
import { fetchSitemap, buildSitemapFindings } from './sitemap'
import { extractSecurityHeaders, buildSecurityHeadersFindings } from './security-headers'
import { analyzeMobileSignals, buildMobileFindings } from './mobile'
import { analyzeLocalSignals, buildLocalSignalsFindings } from './local-signals'
import { analyzeContent, buildContentFindings } from './content'
import { analyzeSocialLinks, buildSocialFindings } from './social'
import type { Finding, FindingCategory } from './types'

/**
 * The one reusable homepage analysis engine — CHECK §1-12. Every
 * `/tools/*-checker` page (lib/website-analyzer/tools.ts) calls this
 * exact same function and filters the result to its own category; none
 * of them re-implements any analysis logic themselves. See
 * lib/website-analyzer/types.ts for the normalized `Finding` shape and
 * docs/tool-security.md for the fetch-safety contract every network
 * call here goes through.
 */

// ============================================================
// Zero-cost, file-backed cache — one full analysis serves every tool a
// visitor runs against the same URL in the cache window, so checking
// e.g. schema-checker right after seo-audit for the same site doesn't
// re-fetch the homepage. Follows lib/file-store.ts's existing pattern
// (ADR-013) directly, same reasoning lib/tools/cache.ts already
// documents — not reused verbatim because that module's helpers are
// shaped around the generic ToolResult, which has no `category` field
// to filter on; the raw, categorized `Finding[]` needs to survive the
// cache round-trip.
// ============================================================

const CACHE_FILE = 'website-analyzer-cache.json'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

interface CacheEntry {
  findings: Finding[]
  expiresAt: string
}

function cacheKeyFor(url: string): string {
  return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex')
}

function getCachedFindings(url: string): Finding[] | null {
  const store = readStore<CacheEntry>(CACHE_FILE)
  const entry = store[cacheKeyFor(url)]
  if (!entry) return null
  if (Date.parse(entry.expiresAt) <= Date.now()) return null
  return entry.findings
}

function setCachedFindings(url: string, findings: Finding[]): void {
  const store = readStore<CacheEntry>(CACHE_FILE)
  store[cacheKeyFor(url)] = { findings, expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString() }
  writeStore(CACHE_FILE, store)
}

// ============================================================
// The actual analysis
// ============================================================

async function runFullAnalysis(rawUrl: string): Promise<Finding[]> {
  // Let a homepage-fetch failure (SSRF-blocked, timeout, unreachable —
  // all thrown as a typed ToolError by lib/tools/security.ts safeFetch())
  // propagate all the way up. Without the homepage itself, nothing else
  // in this function can run meaningfully — lib/tools/execution.ts's
  // executeTool() will catch this and show the tool's real 'error' state
  // (with a retry button when appropriate), which is more honest than a
  // "successful" result full of empty findings.
  const httpEvidence = await fetchHomepage(rawUrl)
  const findings: Finding[] = [...buildHttpFindings(httpEvidence)]

  const $ = parseHtml(httpEvidence.body)

  if (!$) {
    findings.push({
      id: 'html-parse-error',
      category: 'metadata',
      severity: 'warning',
      title: 'Page content',
      whatWeFound: "We couldn't read your homepage's HTML content.",
      whyItMatters: 'Without readable HTML, the on-page checks below could not run.',
      recommendedAction: 'Try running this check again — if it keeps failing, there may be something unusual about how your page is served.',
      evidence: {},
      confidence: 'unavailable',
      status: 'ERROR',
    })
  } else {
    const metadataEvidence = extractMetadata($)
    findings.push(...buildMetadataFindings(metadataEvidence))

    const headingsEvidence = extractHeadings($)
    findings.push(...buildHeadingsFindings(headingsEvidence))

    const links = extractLinks($, httpEvidence.finalUrl)
    const linksEvidence = summarizeLinks(links)
    const checkedLinks = await checkLinkReachability(links)
    findings.push(...buildLinksFindings(linksEvidence, checkedLinks))

    const images = extractImages($)
    const imagesEvidence = summarizeImages(images)
    findings.push(...buildImagesFindings(imagesEvidence))

    const schemaEvidence = extractSchema($)
    findings.push(...buildSchemaFindings(schemaEvidence))

    const mobileEvidence = analyzeMobileSignals($, Boolean(metadataEvidence.viewport), imagesEvidence.totalImages)
    findings.push(...buildMobileFindings(mobileEvidence))

    const localSignalsEvidence = analyzeLocalSignals($, {
      title: metadataEvidence.title,
      h1Text: headingsEvidence.h1Texts[0] ?? null,
      headingTexts: headingsEvidence.sequence.map((h) => h.text),
    })
    findings.push(...buildLocalSignalsFindings(localSignalsEvidence))

    const contentEvidence = analyzeContent($, {
      hasContactInfo: localSignalsEvidence.contactCtaFound || localSignalsEvidence.phoneFound,
      hasCta: localSignalsEvidence.contactCtaFound,
      addressLikelyFound: localSignalsEvidence.addressLikelyFound,
      h1Found: headingsEvidence.h1Count > 0,
      metaDescriptionLength: metadataEvidence.metaDescriptionLength,
    })
    findings.push(...buildContentFindings(contentEvidence))

    findings.push(...buildSocialFindings(analyzeSocialLinks($)))
  }

  findings.push(...buildSecurityHeadersFindings(extractSecurityHeaders(httpEvidence.headers)))

  const origin = new URL(httpEvidence.finalUrl).origin
  const [robotsEvidence, sitemapEvidence] = await Promise.all([fetchRobotsTxt(origin), fetchSitemap(origin)])
  findings.push(...buildRobotsFindings(robotsEvidence))
  findings.push(...buildSitemapFindings(sitemapEvidence))

  return findings
}

export interface WebsiteAnalysisResult {
  findings: Finding[]
  cached: boolean
}

/** The full, all-category analysis — cached per URL. Every `/tools/*-checker` page filters this down to its own category via analyzeWebsiteForCategories() below, rather than calling this (or re-implementing any of it) directly. */
export async function analyzeWebsite(rawUrl: string): Promise<WebsiteAnalysisResult> {
  const cached = getCachedFindings(rawUrl)
  if (cached) return { findings: cached, cached: true }

  const findings = await runFullAnalysis(rawUrl)
  setCachedFindings(rawUrl, findings)
  return { findings, cached: false }
}

/** What every individual tool actually calls — the same engine, filtered to the categories that tool cares about. This is the concrete mechanism behind "reuse the same engine, do not duplicate analysis logic." */
export async function analyzeWebsiteForCategories(rawUrl: string, categories: FindingCategory[]): Promise<WebsiteAnalysisResult> {
  const { findings, cached } = await analyzeWebsite(rawUrl)
  return { findings: findings.filter((f) => categories.includes(f.category)), cached }
}
