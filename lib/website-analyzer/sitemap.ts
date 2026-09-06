import 'server-only'
import { safeFetch, AUXILIARY_FETCH_OPTIONS } from './security'
import { parseHtml } from './html-parser'
import type { Finding } from './types'

/**
 * CHECK §8: fetch /sitemap.xml. Deliberately does not follow anything a
 * sitemap references — a sitemap index's child sitemaps are counted,
 * never fetched, matching "Do not recursively crawl huge sitemaps" and
 * this engine's broader "homepage-only, one fetch per real thing"
 * posture (docs/tool-security.md "No recursive crawling").
 */

/** Counting is capped, not the raw XML — a sitemap with 50,000 <url> entries still parses fine (cheerio streams the DOM once), this just stops *counting* past a sane number rather than reporting an unbounded figure. */
const MAX_ENTRIES_COUNTED = 5000

export interface SitemapEvidence {
  exists: boolean
  accessible: boolean
  isSitemapIndex: boolean
  entryCount: number
  entryCountIsApproximate: boolean
  fetchFailed: boolean
}

export async function fetchSitemap(siteOrigin: string): Promise<SitemapEvidence> {
  const empty = { exists: false, accessible: false, isSitemapIndex: false, entryCount: 0, entryCountIsApproximate: false }

  let url: string
  try {
    url = new URL('/sitemap.xml', siteOrigin).toString()
  } catch {
    return { ...empty, fetchFailed: true }
  }

  try {
    const result = await safeFetch(url, AUXILIARY_FETCH_OPTIONS)

    if (result.status === 404) return { ...empty, exists: false, accessible: true, fetchFailed: false }
    if (result.status < 200 || result.status >= 300) return { ...empty, exists: true, accessible: false, fetchFailed: false }

    const $ = parseHtml(result.body, { xmlMode: true })
    if (!$) return { ...empty, exists: true, accessible: false, fetchFailed: false }

    const isSitemapIndex = $('sitemapindex').length > 0
    const entries = isSitemapIndex ? $('sitemapindex > sitemap') : $('urlset > url')

    return {
      exists: true,
      accessible: true,
      isSitemapIndex,
      entryCount: Math.min(entries.length, MAX_ENTRIES_COUNTED),
      entryCountIsApproximate: entries.length > MAX_ENTRIES_COUNTED || result.truncated,
      fetchFailed: false,
    }
  } catch {
    return { ...empty, fetchFailed: true }
  }
}

export function buildSitemapFindings(evidence: SitemapEvidence): Finding[] {
  if (evidence.fetchFailed) {
    return [
      {
        id: 'sitemap-xml',
        category: 'sitemap',
        severity: 'info',
        title: 'sitemap.xml',
        whatWeFound: "We couldn't check your sitemap.xml right now (the request timed out or the site didn't respond).",
        whyItMatters: 'A sitemap helps search engines discover every page on your site, not just the ones they find by following links.',
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
        id: 'sitemap-xml',
        category: 'sitemap',
        severity: 'warning',
        title: 'sitemap.xml',
        whatWeFound: 'Your site has no sitemap.xml file.',
        whyItMatters: 'Without a sitemap, search engines have to discover every page on your site purely by following links — a sitemap makes discovery faster and more complete, especially for a newer site with few inbound links yet.',
        recommendedAction: 'Add a sitemap.xml listing your real pages (most site builders/CMSs can generate this automatically).',
        evidence: {},
        confidence: 'verified',
        status: 'NOT_FOUND',
      },
    ]
  }

  if (!evidence.accessible) {
    return [
      {
        id: 'sitemap-xml',
        category: 'sitemap',
        severity: 'warning',
        title: 'sitemap.xml',
        whatWeFound: 'Your site has a sitemap.xml, but it did not load or parse successfully.',
        whyItMatters: 'A sitemap search engines cannot read provides none of its benefit.',
        recommendedAction: 'Check that /sitemap.xml returns valid XML with a normal 200 response.',
        evidence: {},
        confidence: 'verified',
        status: 'FAIL',
      },
    ]
  }

  return [
    {
      id: 'sitemap-xml',
      category: 'sitemap',
      severity: 'good',
      title: 'sitemap.xml',
      whatWeFound: evidence.isSitemapIndex
        ? `Your sitemap is a sitemap index referencing ${evidence.entryCount}${evidence.entryCountIsApproximate ? '+' : ''} child sitemaps.`
        : `Your sitemap lists ${evidence.entryCount}${evidence.entryCountIsApproximate ? '+' : ''} page${evidence.entryCount === 1 ? '' : 's'}.`,
      whyItMatters: 'This is exactly what a sitemap is for — a direct, complete list search engines can use to discover your pages.',
      recommendedAction: 'Nothing to do here — keep it up to date as you add or remove pages.',
      evidence: { isSitemapIndex: evidence.isSitemapIndex, entryCount: evidence.entryCount },
      confidence: 'verified',
      status: 'FOUND',
    },
  ]
}
