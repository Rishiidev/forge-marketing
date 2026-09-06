import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'

/**
 * CHECK §10: mobile signals. Every check here except the viewport tag
 * itself is explicitly a heuristic — this engine never renders the page
 * or measures real layout, so "horizontal overflow" and "desktop-only
 * layout" are inferred from markup/CSS patterns, not observed directly.
 * Labeled 'heuristic' confidence throughout, per the brief's own
 * instruction to be explicit about that.
 */

const FIXED_WIDTH_THRESHOLD_PX = 600
const FIXED_WIDTH_PATTERN = /width\s*:\s*(\d{3,5})px/gi

export interface MobileEvidence {
  hasViewportTag: boolean
  fixedWidthSignalCount: number
  fixedWidthExamples: string[]
  responsiveImageCount: number
  totalImages: number
  /** null = no inline <style> block existed to check at all — an external stylesheet may still be fully responsive; this engine doesn't fetch it (see docs/tool-security.md "No recursive crawling" — a linked stylesheet is a second resource, not the homepage itself). */
  hasInlineMediaQuery: boolean | null
}

function findFixedWidthSignals($: ParsedDocument): { count: number; examples: string[] } {
  const examples: string[] = []
  let count = 0

  $('[style]').each((_, el) => {
    const style = $(el).attr('style') ?? ''
    const matches = [...style.matchAll(FIXED_WIDTH_PATTERN)]
    for (const match of matches) {
      const px = Number(match[1])
      if (px >= FIXED_WIDTH_THRESHOLD_PX) {
        count += 1
        if (examples.length < 5) examples.push(`${el.tagName} width:${px}px`)
      }
    }
  })

  $('style').each((_, el) => {
    const css = $(el).text()
    const matches = [...css.matchAll(FIXED_WIDTH_PATTERN)]
    for (const match of matches) {
      const px = Number(match[1])
      if (px >= FIXED_WIDTH_THRESHOLD_PX) {
        count += 1
        if (examples.length < 5) examples.push(`inline stylesheet width:${px}px`)
      }
    }
  })

  return { count, examples }
}

export function analyzeMobileSignals($: ParsedDocument, hasViewportTag: boolean, totalImages: number): MobileEvidence {
  const { count: fixedWidthSignalCount, examples: fixedWidthExamples } = findFixedWidthSignals($)
  const responsiveImageCount = $('img[srcset], img[sizes], picture').length

  const styleBlocks = $('style')
  const hasInlineMediaQuery = styleBlocks.length === 0 ? null : styleBlocks.toArray().some((el) => $(el).text().includes('@media'))

  return { hasViewportTag, fixedWidthSignalCount, fixedWidthExamples, responsiveImageCount, totalImages, hasInlineMediaQuery }
}

export function buildMobileFindings(evidence: MobileEvidence): Finding[] {
  const findings: Finding[] = []

  findings.push({
    id: 'mobile-viewport',
    category: 'mobile',
    severity: evidence.hasViewportTag ? 'good' : 'critical',
    title: 'Mobile viewport',
    whatWeFound: evidence.hasViewportTag ? 'Your homepage has a mobile viewport tag.' : 'Your homepage has no mobile viewport tag.',
    whyItMatters: 'This is the single most important mobile signal — without it, phones render your page at desktop width and shrink it, making everything tiny.',
    recommendedAction: evidence.hasViewportTag ? 'Nothing to do here.' : 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">`.',
    evidence: {},
    confidence: 'verified',
    status: evidence.hasViewportTag ? 'FOUND' : 'NOT_FOUND',
  })

  findings.push({
    id: 'mobile-fixed-width-signals',
    category: 'mobile',
    severity: evidence.fixedWidthSignalCount > 0 ? 'warning' : 'good',
    title: 'Fixed-width layout signals',
    whatWeFound:
      evidence.fixedWidthSignalCount > 0
        ? `Found ${evidence.fixedWidthSignalCount} instance${evidence.fixedWidthSignalCount > 1 ? 's' : ''} of a large fixed pixel width (≥${FIXED_WIDTH_THRESHOLD_PX}px) in the page's own markup/styles: ${evidence.fixedWidthExamples.join(', ')}.`
        : 'No large fixed pixel widths were found in the page\'s own markup/styles.',
    whyItMatters: 'A hard-coded desktop-sized width is one of the most common causes of a page that looks broken or requires horizontal scrolling on a phone.',
    recommendedAction: evidence.fixedWidthSignalCount > 0 ? 'Check the elements listed and replace the fixed width with a percentage, max-width, or a responsive CSS unit.' : 'Nothing to do here.',
    evidence: { examples: evidence.fixedWidthExamples },
    confidence: 'heuristic',
    status: evidence.fixedWidthSignalCount > 0 ? 'PARTIAL' : 'PASS',
  })

  if (evidence.totalImages > 0) {
    findings.push({
      id: 'mobile-responsive-images',
      category: 'mobile',
      severity: evidence.responsiveImageCount > 0 ? 'good' : 'info',
      title: 'Responsive image markup',
      whatWeFound: `${evidence.responsiveImageCount} of ${evidence.totalImages} images use responsive markup (srcset, sizes, or a <picture> element).`,
      whyItMatters: 'Responsive image markup lets the browser download a smaller image file on a phone instead of a full desktop-sized one — a real, direct effect on mobile load time.',
      recommendedAction: evidence.responsiveImageCount < evidence.totalImages ? 'Consider adding srcset/sizes to your larger images so mobile visitors download an appropriately-sized file.' : 'Nothing to do here.',
      evidence: { responsiveImageCount: evidence.responsiveImageCount, totalImages: evidence.totalImages },
      confidence: 'heuristic',
      status: evidence.responsiveImageCount > 0 ? 'PASS' : 'PARTIAL',
    })
  }

  findings.push({
    id: 'mobile-responsive-css',
    category: 'mobile',
    severity: evidence.hasInlineMediaQuery === false ? 'info' : 'good',
    title: 'Responsive CSS (@media rules)',
    whatWeFound:
      evidence.hasInlineMediaQuery === null
        ? "Your homepage's styling is mostly in external stylesheets, which this check doesn't fetch — so this can't be checked from the page markup alone."
        : evidence.hasInlineMediaQuery
          ? "Found @media rules in the page's own inline styles, a sign of responsive design."
          : "No @media rules were found in the page's own inline styles.",
    whyItMatters: '@media rules are what let a site adapt its layout to different screen sizes — their absence (where checkable) is worth a closer look, though most real sites keep their CSS in external files this check intentionally does not fetch.',
    recommendedAction: evidence.hasInlineMediaQuery === false ? 'Worth manually checking your external stylesheet for responsive (@media) rules.' : 'Nothing to do here.',
    evidence: {},
    confidence: evidence.hasInlineMediaQuery === null ? 'unavailable' : 'heuristic',
    status: evidence.hasInlineMediaQuery === null ? 'NOT_APPLICABLE' : evidence.hasInlineMediaQuery ? 'PASS' : 'PARTIAL',
  })

  return findings
}
