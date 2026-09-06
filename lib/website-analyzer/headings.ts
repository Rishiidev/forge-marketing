import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'

/** CHECK §3: H1 count/text, H2/H3 structure, missing hierarchy, repeated headings where detectable. All read directly from the DOM — 'verified' confidence throughout. */

export interface HeadingEntry {
  level: number
  text: string
}

export interface HeadingsEvidence {
  h1Count: number
  h1Texts: string[]
  h2Count: number
  h3Count: number
  sequence: HeadingEntry[]
  /** A heading more than one level deeper than the previous one (e.g. H1 straight to H3, skipping H2). */
  hasSkippedLevel: boolean
  /** Exact-text duplicates (case-insensitive, trimmed) among H1/H2/H3 — this is a defensible, purely textual check, not a claim about semantic duplication. */
  duplicateHeadingTexts: string[]
}

export function extractHeadings($: ParsedDocument): HeadingsEvidence {
  const sequence: HeadingEntry[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = Number(el.tagName.slice(1))
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text) sequence.push({ level, text })
  })

  let hasSkippedLevel = false
  let previousLevel = 0
  for (const heading of sequence) {
    if (previousLevel > 0 && heading.level > previousLevel + 1) hasSkippedLevel = true
    previousLevel = heading.level
  }

  const textCounts = new Map<string, number>()
  for (const heading of sequence) {
    if (heading.level > 3) continue
    const key = heading.text.toLowerCase()
    textCounts.set(key, (textCounts.get(key) ?? 0) + 1)
  }
  const duplicateHeadingTexts = [...textCounts.entries()].filter(([, count]) => count > 1).map(([text]) => text)

  const h1Texts = sequence.filter((h) => h.level === 1).map((h) => h.text)

  return {
    h1Count: h1Texts.length,
    h1Texts,
    h2Count: sequence.filter((h) => h.level === 2).length,
    h3Count: sequence.filter((h) => h.level === 3).length,
    sequence,
    hasSkippedLevel,
    duplicateHeadingTexts,
  }
}

export function buildHeadingsFindings(evidence: HeadingsEvidence): Finding[] {
  const findings: Finding[] = []

  if (evidence.h1Count === 0) {
    findings.push({
      id: 'headings-h1',
      category: 'headings',
      severity: 'critical',
      title: 'Main heading (H1)',
      whatWeFound: 'Your homepage has no H1 heading.',
      whyItMatters: 'The H1 is the single clearest signal to both visitors and search engines of what a page is actually about — without one, that signal is missing entirely.',
      recommendedAction: 'Add exactly one H1 near the top of the page, naming your business or its core offer.',
      evidence: {},
      confidence: 'verified',
      status: 'NOT_FOUND',
    })
  } else if (evidence.h1Count > 1) {
    findings.push({
      id: 'headings-h1',
      category: 'headings',
      severity: 'warning',
      title: 'Main heading (H1)',
      whatWeFound: `Your homepage has ${evidence.h1Count} H1 headings: ${evidence.h1Texts.map((t) => `"${t}"`).join(', ')}.`,
      whyItMatters: 'Multiple H1s can dilute the single clear "this page is about X" signal search engines look for — one strong H1 usually reads better than several competing ones.',
      recommendedAction: 'Keep the one that best represents the page and change the others to H2s.',
      evidence: { h1Texts: evidence.h1Texts },
      confidence: 'verified',
      status: 'PARTIAL',
    })
  } else {
    findings.push({
      id: 'headings-h1',
      category: 'headings',
      severity: 'good',
      title: 'Main heading (H1)',
      whatWeFound: `Your homepage has exactly one H1: "${evidence.h1Texts[0]}".`,
      whyItMatters: 'A single, clear H1 is exactly what both visitors and search engines expect.',
      recommendedAction: 'Nothing to do here.',
      evidence: { h1Text: evidence.h1Texts[0] },
      confidence: 'verified',
      status: 'PASS',
    })
  }

  findings.push({
    id: 'headings-hierarchy',
    category: 'headings',
    severity: evidence.hasSkippedLevel ? 'warning' : 'good',
    title: 'Heading structure',
    whatWeFound: evidence.hasSkippedLevel
      ? 'Your headings skip a level somewhere on the page (e.g. jumping from an H1 straight to an H3, with no H2 in between).'
      : `Your homepage has ${evidence.h2Count} H2 and ${evidence.h3Count} H3 headings, in a normal top-to-bottom order.`,
    whyItMatters: 'A clean heading hierarchy (H1 → H2 → H3, no skipped levels) helps screen-reader users navigate the page and helps search engines understand how your content is organized.',
    recommendedAction: evidence.hasSkippedLevel ? 'Check the skipped section and add the missing heading level, or renumber the headings so they step down one level at a time.' : 'Nothing to do here.',
    evidence: { h2Count: evidence.h2Count, h3Count: evidence.h3Count, sequence: evidence.sequence.map((h) => `H${h.level}: ${h.text}`) },
    confidence: 'verified',
    status: evidence.hasSkippedLevel ? 'PARTIAL' : 'PASS',
  })

  if (evidence.duplicateHeadingTexts.length > 0) {
    findings.push({
      id: 'headings-duplicates',
      category: 'headings',
      severity: 'info',
      title: 'Repeated heading text',
      whatWeFound: `${evidence.duplicateHeadingTexts.length} heading${evidence.duplicateHeadingTexts.length > 1 ? 's appear' : ' appears'} more than once on the page: ${evidence.duplicateHeadingTexts.map((t) => `"${t}"`).join(', ')}.`,
      whyItMatters: 'Not necessarily a problem — but identical, repeated section headings can make it harder for a visitor scanning the page to tell sections apart.',
      recommendedAction: 'Worth a quick look — consider making each heading more specific to its own section.',
      evidence: { duplicates: evidence.duplicateHeadingTexts },
      confidence: 'verified',
      status: 'PARTIAL',
    })
  }

  return findings
}
