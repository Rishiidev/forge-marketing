import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'

/** CHECK §5: alt presence, dimensions where available, lazy loading, oversized-image signals (heuristic — no image is actually downloaded to check its real byte size). */

const OVERSIZED_DIMENSION_THRESHOLD = 1600 // px, in a markup width/height attribute

export interface ImageInfo {
  src: string
  hasAlt: boolean
  width: number | null
  height: number | null
  loading: string | null
}

export interface ImagesEvidence {
  totalImages: number
  missingAltSrcs: string[]
  withoutDimensionsCount: number
  lazyLoadedCount: number
  /** Images whose declared markup width/height suggest a large asset with no lazy-loading hint — a markup-only heuristic, not a real byte-size measurement. */
  oversizedSignalSrcs: string[]
}

function parseDimension(value: string | undefined): number | null {
  if (!value) return null
  const n = Number(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function extractImages($: ParsedDocument): ImageInfo[] {
  const images: ImageInfo[] = []
  $('img').each((_, el) => {
    const $el = $(el)
    const src = $el.attr('src')?.trim() || $el.attr('data-src')?.trim() || '(no src)'
    images.push({
      src,
      hasAlt: $el.attr('alt') !== undefined && $el.attr('alt')!.trim().length > 0,
      width: parseDimension($el.attr('width')),
      height: parseDimension($el.attr('height')),
      loading: $el.attr('loading')?.trim() || null,
    })
  })
  return images
}

export function summarizeImages(images: ImageInfo[]): ImagesEvidence {
  return {
    totalImages: images.length,
    missingAltSrcs: images.filter((img) => !img.hasAlt).map((img) => img.src),
    withoutDimensionsCount: images.filter((img) => img.width === null || img.height === null).length,
    lazyLoadedCount: images.filter((img) => img.loading === 'lazy').length,
    oversizedSignalSrcs: images
      .filter((img) => (img.width !== null && img.width > OVERSIZED_DIMENSION_THRESHOLD) || (img.height !== null && img.height > OVERSIZED_DIMENSION_THRESHOLD))
      .filter((img) => img.loading !== 'lazy')
      .map((img) => img.src),
  }
}

export function buildImagesFindings(evidence: ImagesEvidence): Finding[] {
  const findings: Finding[] = []

  if (evidence.totalImages === 0) {
    findings.push({
      id: 'images-overview',
      category: 'images',
      severity: 'info',
      title: 'Images on this page',
      whatWeFound: 'Your homepage has no `<img>` tags.',
      whyItMatters: 'Nothing to check here — some homepages are text/CSS-only by design.',
      recommendedAction: 'Nothing to do here.',
      evidence: {},
      confidence: 'verified',
      status: 'NOT_APPLICABLE',
    })
    return findings
  }

  findings.push({
    id: 'images-alt-text',
    category: 'images',
    severity: evidence.missingAltSrcs.length > 0 ? 'warning' : 'good',
    title: 'Image alt text',
    whatWeFound:
      evidence.missingAltSrcs.length > 0
        ? `${evidence.missingAltSrcs.length} of ${evidence.totalImages} images have no alt text.`
        : `All ${evidence.totalImages} images on your homepage have alt text.`,
    whyItMatters: 'Alt text is what a screen reader announces instead of the image, and what search engines use to understand what the image shows — a missing one is invisible to both.',
    recommendedAction: evidence.missingAltSrcs.length > 0 ? 'Add a short, specific alt attribute describing each image (an empty alt="" is fine only for purely decorative images).' : 'Nothing to do here.',
    evidence: { missingCount: evidence.missingAltSrcs.length, total: evidence.totalImages, examples: evidence.missingAltSrcs.slice(0, 5) },
    confidence: 'verified',
    status: evidence.missingAltSrcs.length > 0 ? 'FAIL' : 'PASS',
  })

  findings.push({
    id: 'images-dimensions',
    category: 'images',
    severity: evidence.withoutDimensionsCount > 0 ? 'info' : 'good',
    title: 'Image dimensions declared in markup',
    whatWeFound:
      evidence.withoutDimensionsCount > 0
        ? `${evidence.withoutDimensionsCount} of ${evidence.totalImages} images have no width/height set in their markup.`
        : `All ${evidence.totalImages} images declare their width/height in markup.`,
    whyItMatters: "Without declared dimensions, the browser doesn't know how much space to reserve for an image before it loads — the page can visibly jump as images pop in.",
    recommendedAction: evidence.withoutDimensionsCount > 0 ? 'Add width/height attributes (or an aspect-ratio in CSS) to the affected images.' : 'Nothing to do here.',
    evidence: { withoutDimensionsCount: evidence.withoutDimensionsCount, total: evidence.totalImages },
    confidence: 'verified',
    status: evidence.withoutDimensionsCount > 0 ? 'PARTIAL' : 'PASS',
  })

  findings.push({
    id: 'images-lazy-loading',
    category: 'images',
    severity: 'info',
    title: 'Lazy loading',
    whatWeFound: `${evidence.lazyLoadedCount} of ${evidence.totalImages} images use lazy loading.`,
    whyItMatters: 'Lazy-loading images below the fold means the browser doesn\'t download them until a visitor scrolls near them — the visible part of the page loads faster.',
    recommendedAction: evidence.lazyLoadedCount < evidence.totalImages ? 'Consider adding `loading="lazy"` to images that appear further down the page (not the first, above-the-fold ones).' : 'Nothing to do here.',
    evidence: { lazyLoadedCount: evidence.lazyLoadedCount, total: evidence.totalImages },
    confidence: 'verified',
    status: 'FOUND',
  })

  if (evidence.oversizedSignalSrcs.length > 0) {
    findings.push({
      id: 'images-oversized-signal',
      category: 'images',
      severity: 'warning',
      title: 'Possibly oversized images',
      whatWeFound: `${evidence.oversizedSignalSrcs.length} image${evidence.oversizedSignalSrcs.length > 1 ? 's declare' : ' declares'} a width or height over ${OVERSIZED_DIMENSION_THRESHOLD}px with no lazy-loading hint — a possible sign of a large, unoptimized file.`,
      whyItMatters: 'A single oversized, uncompressed image is one of the most common causes of a genuinely slow-loading page.',
      recommendedAction: 'Worth checking these specific images — compress them and/or resize them closer to their actual display size.',
      evidence: { examples: evidence.oversizedSignalSrcs.slice(0, 5) },
      confidence: 'heuristic',
      status: 'PARTIAL',
    })
  }

  return findings
}
