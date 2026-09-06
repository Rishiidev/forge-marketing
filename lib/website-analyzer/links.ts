import 'server-only'
import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'
import { safeFetch, LINK_CHECK_FETCH_OPTIONS, MAX_LINKS_TO_CHECK } from './security'

/** CHECK §4: internal/external counts, empty href, malformed href, and — bounded, homepage-only — a real reachability check on a small sample of internal links. */

export interface LinkInfo {
  href: string
  resolvedUrl: string | null
  isInternal: boolean
  isEmpty: boolean
  isMalformed: boolean
}

export interface LinksEvidence {
  totalLinks: number
  internalCount: number
  externalCount: number
  emptyHrefCount: number
  malformedHrefs: string[]
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/** Pure — extracts every `<a href>` on the page and classifies it. No I/O, so it's trivially unit-testable against malformed/edge-case markup. */
export function extractLinks($: ParsedDocument, baseUrl: string): LinkInfo[] {
  const origin = safeOrigin(baseUrl)
  const links: LinkInfo[] = []

  $('a[href]').each((_, el) => {
    const raw = $(el).attr('href') ?? ''
    const trimmed = raw.trim()

    if (!trimmed) {
      links.push({ href: raw, resolvedUrl: null, isInternal: false, isEmpty: true, isMalformed: false })
      return
    }
    // mailto:/tel:/javascript:/plain in-page anchors are valid, just not
    // http(s) navigation — excluded from internal/external counts, never
    // flagged as malformed.
    if (/^(mailto:|tel:|javascript:|#)/i.test(trimmed)) {
      links.push({ href: trimmed, resolvedUrl: null, isInternal: false, isEmpty: false, isMalformed: false })
      return
    }
    if (/\s/.test(trimmed)) {
      links.push({ href: trimmed, resolvedUrl: null, isInternal: false, isEmpty: false, isMalformed: true })
      return
    }
    try {
      const resolved = new URL(trimmed, baseUrl)
      links.push({ href: trimmed, resolvedUrl: resolved.toString(), isInternal: origin !== null && resolved.origin === origin, isEmpty: false, isMalformed: false })
    } catch {
      links.push({ href: trimmed, resolvedUrl: null, isInternal: false, isEmpty: false, isMalformed: true })
    }
  })

  return links
}

export function summarizeLinks(links: LinkInfo[]): LinksEvidence {
  return {
    totalLinks: links.length,
    internalCount: links.filter((l) => l.isInternal).length,
    externalCount: links.filter((l) => !l.isInternal && !l.isEmpty && !l.isMalformed && l.resolvedUrl).length,
    emptyHrefCount: links.filter((l) => l.isEmpty).length,
    malformedHrefs: links.filter((l) => l.isMalformed).map((l) => l.href),
  }
}

export interface LinkCheckResult {
  url: string
  status: number | 'unreachable'
}

/**
 * The one I/O step in this module — reachability-checks at most
 * MAX_LINKS_TO_CHECK internal links, in parallel, each a lightweight
 * HEAD request through the same SSRF-safe safeFetch() every other fetch
 * in this engine uses. "Obvious broken links where safely testable," not
 * a site-wide crawl — see docs/tool-security.md "No recursive crawling."
 */
export async function checkLinkReachability(links: LinkInfo[]): Promise<LinkCheckResult[]> {
  const candidates = links.filter((l) => l.isInternal && l.resolvedUrl).slice(0, MAX_LINKS_TO_CHECK)

  const settled = await Promise.allSettled(
    candidates.map(async (link): Promise<LinkCheckResult> => {
      try {
        const result = await safeFetch(link.resolvedUrl!, LINK_CHECK_FETCH_OPTIONS)
        return { url: link.resolvedUrl!, status: result.status }
      } catch {
        return { url: link.resolvedUrl!, status: 'unreachable' }
      }
    })
  )

  return settled.map((s, i) => (s.status === 'fulfilled' ? s.value : { url: candidates[i]?.resolvedUrl ?? '', status: 'unreachable' as const }))
}

export function buildLinksFindings(evidence: LinksEvidence, checkedLinks: LinkCheckResult[]): Finding[] {
  const findings: Finding[] = []

  findings.push({
    id: 'links-overview',
    category: 'links',
    severity: 'info',
    title: 'Links on this page',
    whatWeFound: `Your homepage has ${evidence.totalLinks} links — ${evidence.internalCount} to other pages on your own site, ${evidence.externalCount} to other sites.`,
    whyItMatters: 'Internal links help visitors (and search engines) find the rest of your site; external links send trust and attention elsewhere.',
    recommendedAction: 'Nothing to do here — this is just a count.',
    evidence: { totalLinks: evidence.totalLinks, internalCount: evidence.internalCount, externalCount: evidence.externalCount },
    confidence: 'verified',
    status: 'FOUND',
  })

  if (evidence.emptyHrefCount > 0) {
    findings.push({
      id: 'links-empty-href',
      category: 'links',
      severity: 'warning',
      title: 'Links with no destination',
      whatWeFound: `${evidence.emptyHrefCount} link${evidence.emptyHrefCount > 1 ? 's have' : ' has'} an empty or missing href.`,
      whyItMatters: 'A link with nowhere to go is either a broken placeholder or dead code left in the page — either way, clicking it does nothing for a visitor.',
      recommendedAction: 'Find these links in your page source and either give them a real destination or remove them.',
      evidence: { emptyHrefCount: evidence.emptyHrefCount },
      confidence: 'verified',
      status: 'FAIL',
    })
  }

  if (evidence.malformedHrefs.length > 0) {
    findings.push({
      id: 'links-malformed-href',
      category: 'links',
      severity: 'warning',
      title: 'Malformed link addresses',
      whatWeFound: `${evidence.malformedHrefs.length} link${evidence.malformedHrefs.length > 1 ? 's have' : ' has'} an address that doesn't look like a valid URL: ${evidence.malformedHrefs.slice(0, 5).join(', ')}${evidence.malformedHrefs.length > 5 ? ', …' : ''}.`,
      whyItMatters: "A malformed link usually means a typo when the page was built — it won't work reliably in every browser.",
      recommendedAction: 'Fix these link addresses in your page source.',
      evidence: { malformedHrefs: evidence.malformedHrefs },
      confidence: 'verified',
      status: 'FAIL',
    })
  }

  if (checkedLinks.length === 0) {
    findings.push({
      id: 'links-reachability',
      category: 'links',
      severity: 'info',
      title: 'Internal link reachability',
      whatWeFound: 'Your homepage has no internal links to check.',
      whyItMatters: 'Nothing to verify here.',
      recommendedAction: 'Nothing to do here.',
      evidence: {},
      confidence: 'unavailable',
      status: 'NOT_APPLICABLE',
    })
  } else {
    const broken = checkedLinks.filter((l) => l.status === 'unreachable' || (typeof l.status === 'number' && l.status >= 400))
    findings.push({
      id: 'links-reachability',
      category: 'links',
      severity: broken.length > 0 ? 'warning' : 'good',
      title: 'Internal link reachability',
      whatWeFound:
        broken.length > 0
          ? `We checked ${checkedLinks.length} of your internal links and ${broken.length} didn't respond normally: ${broken.map((l) => `${l.url} (${l.status})`).join(', ')}.`
          : `We checked ${checkedLinks.length} of your internal links (out of ${evidence.internalCount} total) and they all responded normally.`,
      whyItMatters: 'A broken internal link sends a visitor to a dead end — a small thing that quietly erodes trust.',
      recommendedAction: broken.length > 0 ? 'Fix or remove the links listed above.' : 'Nothing to do here.',
      evidence: { checked: checkedLinks.length, totalInternal: evidence.internalCount, results: checkedLinks.map((l) => `${l.url}: ${l.status}`) },
      confidence: 'verified',
      status: broken.length > 0 ? 'PARTIAL' : 'PASS',
    })
  }

  return findings
}
