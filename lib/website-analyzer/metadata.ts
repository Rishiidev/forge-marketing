import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'

/**
 * CHECK §2 (HTML metadata): title, meta description, canonical,
 * viewport, charset, language, robots meta, Open Graph, Twitter/X card.
 * Every value here is read directly from the fetched homepage's own
 * markup — 'verified' confidence throughout, no heuristics in this file.
 */

export interface MetadataEvidence {
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  canonical: string | null
  viewport: string | null
  charset: string | null
  language: string | null
  robotsMeta: string | null
  openGraph: { title?: string; description?: string; image?: string; type?: string; url?: string }
  twitter: { card?: string; title?: string; description?: string; image?: string }
}

function attr($: ParsedDocument, selector: string, attribute: string): string | null {
  const value = $(selector).first().attr(attribute)
  return value && value.trim() ? value.trim() : null
}

export function extractMetadata($: ParsedDocument): MetadataEvidence {
  const title = $('title').first().text().trim() || null
  const metaDescription = attr($, 'meta[name="description"]', 'content')
  const charset = $('meta[charset]').attr('charset')?.trim() || (attr($, 'meta[http-equiv="Content-Type"]', 'content')?.match(/charset=([\w-]+)/i)?.[1] ?? null)

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical: attr($, 'link[rel="canonical"]', 'href'),
    viewport: attr($, 'meta[name="viewport"]', 'content'),
    charset,
    language: attr($, 'html', 'lang'),
    robotsMeta: attr($, 'meta[name="robots"]', 'content'),
    openGraph: {
      title: attr($, 'meta[property="og:title"]', 'content') ?? undefined,
      description: attr($, 'meta[property="og:description"]', 'content') ?? undefined,
      image: attr($, 'meta[property="og:image"]', 'content') ?? undefined,
      type: attr($, 'meta[property="og:type"]', 'content') ?? undefined,
      url: attr($, 'meta[property="og:url"]', 'content') ?? undefined,
    },
    twitter: {
      card: attr($, 'meta[name="twitter:card"]', 'content') ?? undefined,
      title: attr($, 'meta[name="twitter:title"]', 'content') ?? undefined,
      description: attr($, 'meta[name="twitter:description"]', 'content') ?? undefined,
      image: attr($, 'meta[name="twitter:image"]', 'content') ?? undefined,
    },
  }
}

export function buildMetadataFindings(evidence: MetadataEvidence): Finding[] {
  const findings: Finding[] = []

  if (!evidence.title) {
    findings.push({
      id: 'meta-title',
      category: 'metadata',
      severity: 'critical',
      title: 'Page title',
      whatWeFound: 'Your homepage has no page title.',
      whyItMatters: 'The title is what shows up as the clickable headline in Google search results and browser tabs — without one, search engines guess, and it usually guesses badly.',
      recommendedAction: 'Add a clear, specific `<title>` naming your business and what you do (e.g. "Studio Mysa — Hair Salon in Bengaluru").',
      evidence: {},
      confidence: 'verified',
      status: 'NOT_FOUND',
    })
  } else {
    const tooShort = evidence.titleLength < 10
    const tooLong = evidence.titleLength > 70
    findings.push({
      id: 'meta-title',
      category: 'metadata',
      severity: tooShort || tooLong ? 'warning' : 'good',
      title: 'Page title',
      whatWeFound: `Your page title is "${evidence.title}" (${evidence.titleLength} characters).`,
      whyItMatters: tooLong
        ? 'Google typically cuts a title off around 60-70 characters in search results — anything past that gets truncated.'
        : tooShort
          ? "A very short title is a missed opportunity to tell both search engines and visitors what your business actually does."
          : "This is the clickable headline visitors see in search results before they ever reach your site.",
      recommendedAction: tooLong ? 'Shorten it to the most important 50-60 characters.' : tooShort ? 'Expand it to name your business and what you offer.' : 'Nothing to do here.',
      evidence: { title: evidence.title, length: evidence.titleLength },
      confidence: 'verified',
      status: tooShort || tooLong ? 'PARTIAL' : 'PASS',
    })
  }

  if (!evidence.metaDescription) {
    findings.push({
      id: 'meta-description',
      category: 'metadata',
      severity: 'warning',
      title: 'Meta description',
      whatWeFound: 'Your homepage has no meta description.',
      whyItMatters: "This is the short summary that often shows under your title in Google search results — without one, Google picks a snippet of your page text instead, which is usually less persuasive.",
      recommendedAction: 'Add a one- or two-sentence `<meta name="description">` summarizing what your business offers.',
      evidence: {},
      confidence: 'verified',
      status: 'NOT_FOUND',
    })
  } else {
    const tooShort = evidence.metaDescriptionLength < 50
    const tooLong = evidence.metaDescriptionLength > 160
    findings.push({
      id: 'meta-description',
      category: 'metadata',
      severity: tooShort || tooLong ? 'warning' : 'good',
      title: 'Meta description',
      whatWeFound: `Your meta description is ${evidence.metaDescriptionLength} characters: "${evidence.metaDescription}"`,
      whyItMatters: tooLong ? 'Google typically truncates a description past about 155-160 characters.' : tooShort ? "A short description is a missed chance to summarize what makes your business worth clicking on." : 'This is often the first real sentence a searcher reads about your business.',
      recommendedAction: tooLong ? 'Trim it to the most important ~150 characters.' : tooShort ? 'Expand it to a full one- or two-sentence pitch.' : 'Nothing to do here.',
      evidence: { description: evidence.metaDescription, length: evidence.metaDescriptionLength },
      confidence: 'verified',
      status: tooShort || tooLong ? 'PARTIAL' : 'PASS',
    })
  }

  findings.push({
    id: 'meta-canonical',
    category: 'metadata',
    severity: evidence.canonical ? 'good' : 'info',
    title: 'Canonical link',
    whatWeFound: evidence.canonical ? `Your homepage declares its canonical URL as ${evidence.canonical}.` : 'Your homepage has no canonical link tag.',
    whyItMatters: 'A canonical tag tells search engines which URL is the "real" one when a page is reachable multiple ways (with/without www, with a trailing slash, etc.) — without it, search engines have to guess.',
    recommendedAction: evidence.canonical ? 'Nothing to do here.' : 'Add a `<link rel="canonical">` pointing at your homepage\'s preferred address.',
    evidence: { canonical: evidence.canonical },
    confidence: 'verified',
    status: evidence.canonical ? 'FOUND' : 'NOT_FOUND',
  })

  findings.push({
    id: 'meta-viewport',
    category: 'metadata',
    severity: evidence.viewport ? 'good' : 'critical',
    title: 'Mobile viewport tag',
    whatWeFound: evidence.viewport ? `Your homepage has a viewport tag: "${evidence.viewport}".` : 'Your homepage has no viewport meta tag.',
    whyItMatters: 'Without this tag, mobile browsers render the page at desktop width and shrink it to fit — text becomes tiny and visitors have to pinch-zoom to read anything.',
    recommendedAction: evidence.viewport ? 'Nothing to do here.' : 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to the page head.',
    evidence: { viewport: evidence.viewport },
    confidence: 'verified',
    status: evidence.viewport ? 'FOUND' : 'NOT_FOUND',
  })

  findings.push({
    id: 'meta-charset',
    category: 'metadata',
    severity: evidence.charset ? 'good' : 'warning',
    title: 'Character encoding',
    whatWeFound: evidence.charset ? `Your homepage declares its character encoding as ${evidence.charset}.` : 'Your homepage has no declared character encoding.',
    whyItMatters: 'Without a declared encoding, special characters (currency symbols, accented letters, curly quotes) can render as garbled text in some browsers.',
    recommendedAction: evidence.charset ? 'Nothing to do here.' : 'Add `<meta charset="utf-8">` as the very first tag inside the page head.',
    evidence: { charset: evidence.charset },
    confidence: 'verified',
    status: evidence.charset ? 'FOUND' : 'NOT_FOUND',
  })

  findings.push({
    id: 'meta-language',
    category: 'metadata',
    severity: evidence.language ? 'good' : 'info',
    title: 'Declared language',
    whatWeFound: evidence.language ? `Your homepage declares its language as "${evidence.language}".` : 'Your homepage has no declared language.',
    whyItMatters: 'Screen readers and search engines both use this to know how to read/index your content correctly.',
    recommendedAction: evidence.language ? 'Nothing to do here.' : 'Add a `lang` attribute to your `<html>` tag (e.g. `<html lang="en">`).',
    evidence: { language: evidence.language },
    confidence: 'verified',
    status: evidence.language ? 'FOUND' : 'NOT_FOUND',
  })

  const noindex = evidence.robotsMeta?.toLowerCase().includes('noindex') ?? false
  findings.push({
    id: 'meta-robots',
    category: 'metadata',
    severity: noindex ? 'critical' : 'good',
    title: 'Search engine indexing',
    whatWeFound: noindex
      ? `Your homepage has a robots meta tag telling search engines NOT to index it: "${evidence.robotsMeta}".`
      : evidence.robotsMeta
        ? `Your homepage has a robots meta tag: "${evidence.robotsMeta}" (does not block indexing).`
        : 'Your homepage has no robots meta tag — the default is fully indexable.',
    whyItMatters: noindex ? 'This actively tells Google and other search engines to leave your homepage out of search results entirely — a serious, easy-to-miss mistake.' : 'Search engines can index this page normally.',
    recommendedAction: noindex ? 'Remove the "noindex" directive unless you specifically intend to hide this page from search results.' : 'Nothing to do here.',
    evidence: { robotsMeta: evidence.robotsMeta },
    confidence: 'verified',
    status: noindex ? 'FAIL' : 'PASS',
  })

  const hasOg = Boolean(evidence.openGraph.title || evidence.openGraph.description || evidence.openGraph.image)
  findings.push({
    id: 'meta-open-graph',
    category: 'metadata',
    severity: hasOg ? 'good' : 'info',
    title: 'Open Graph tags (social sharing preview)',
    whatWeFound: hasOg ? `Your homepage has Open Graph tags (title: ${evidence.openGraph.title ? 'yes' : 'no'}, description: ${evidence.openGraph.description ? 'yes' : 'no'}, image: ${evidence.openGraph.image ? 'yes' : 'no'}).` : 'Your homepage has no Open Graph tags.',
    whyItMatters: 'These control how your link looks when shared on Facebook, WhatsApp, LinkedIn, and most other apps — without them, a shared link often shows no image and a random snippet of text.',
    recommendedAction: hasOg ? 'Nothing to do here.' : 'Add og:title, og:description, and og:image tags so shared links look intentional.',
    evidence: { ...evidence.openGraph },
    confidence: 'verified',
    status: hasOg ? 'FOUND' : 'NOT_FOUND',
  })

  const hasTwitter = Boolean(evidence.twitter.card || evidence.twitter.title)
  findings.push({
    id: 'meta-twitter',
    category: 'metadata',
    severity: hasTwitter ? 'good' : 'info',
    title: 'Twitter/X card tags',
    whatWeFound: hasTwitter ? `Your homepage has Twitter/X card tags (card type: ${evidence.twitter.card ?? 'unspecified'}).` : 'Your homepage has no Twitter/X card tags.',
    whyItMatters: 'Controls how your link looks when shared on X/Twitter specifically — without these, X falls back to Open Graph tags if present, or a plain link otherwise.',
    recommendedAction: hasTwitter ? 'Nothing to do here.' : 'Add twitter:card and twitter:title tags, or rely on Open Graph tags if those are already set.',
    evidence: { ...evidence.twitter },
    confidence: 'verified',
    status: hasTwitter ? 'FOUND' : 'NOT_FOUND',
  })

  return findings
}
