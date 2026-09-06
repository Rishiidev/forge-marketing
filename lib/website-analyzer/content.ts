import type { ParsedDocument } from './html-parser'
import { extractVisibleText } from './html-parser'
import type { Finding } from './types'

/**
 * CHECK §12: content signals — visible text quantity, service terms,
 * location terms, contact information, a clear business proposition,
 * CTA presence. Explicitly does not, and must never, make any claim
 * about search rankings — every finding here is about the page's own
 * content, not about how it performs in search.
 *
 * Reuses `hasContactInfo`/`hasCta` from lib/website-analyzer/local-signals.ts's
 * already-computed evidence rather than re-deriving them here — the
 * same "don't duplicate analysis logic" rule this whole engine follows.
 */

const SERVICE_TERM_PATTERN = /\b(service|services|offer|offering|expertise|specialize|specialise|solutions?)\b/i
const LOCATION_TERM_PATTERN = /\b(located in|based in|serving|near you|our (location|store|office|clinic|salon))\b/i

export interface ContentContext {
  hasContactInfo: boolean
  hasCta: boolean
  addressLikelyFound: boolean
  h1Found: boolean
  metaDescriptionLength: number
}

export interface ContentEvidence {
  wordCount: number
  hasServiceTerms: boolean
  hasLocationTerms: boolean
  hasContactInfo: boolean
  hasCta: boolean
  /** Deliberately fuzzy and low-stakes — true only when there's *some* real signal (a real H1 plus either a real meta description or a reasonable amount of body text), never a precision claim. */
  hasClearProposition: boolean
}

export function analyzeContent($: ParsedDocument, context: ContentContext): ContentEvidence {
  const visibleText = extractVisibleText($)
  const wordCount = visibleText.split(/\s+/).filter(Boolean).length

  return {
    wordCount,
    hasServiceTerms: SERVICE_TERM_PATTERN.test(visibleText),
    hasLocationTerms: context.addressLikelyFound || LOCATION_TERM_PATTERN.test(visibleText),
    hasContactInfo: context.hasContactInfo,
    hasCta: context.hasCta,
    hasClearProposition: context.h1Found && (context.metaDescriptionLength > 20 || wordCount > 50),
  }
}

export function buildContentFindings(evidence: ContentEvidence): Finding[] {
  return [
    {
      id: 'content-text-quantity',
      category: 'content',
      severity: evidence.wordCount < 50 ? 'warning' : 'good',
      title: 'Visible text on the page',
      whatWeFound: `Your homepage has about ${evidence.wordCount} words of visible text.`,
      whyItMatters: 'A homepage with very little text gives visitors — and search engines — almost nothing to understand what your business actually does.',
      recommendedAction: evidence.wordCount < 50 ? 'Consider adding a short section explaining who you are, what you offer, and why a customer should choose you.' : 'Nothing to do here.',
      evidence: { wordCount: evidence.wordCount },
      confidence: 'verified',
      status: evidence.wordCount < 50 ? 'PARTIAL' : 'PASS',
    },
    {
      id: 'content-service-terms',
      category: 'content',
      severity: 'info',
      title: 'Service-related language',
      whatWeFound: evidence.hasServiceTerms ? 'Your homepage uses language describing what you offer (e.g. "services," "offer," "specialize").' : 'No clear service-related language was found on your homepage.',
      whyItMatters: 'This is a soft signal, not a defect — but a visitor should be able to quickly tell what kind of business this is.',
      recommendedAction: evidence.hasServiceTerms ? 'Nothing to do here.' : 'Consider making what you offer more explicit somewhere on the page.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.hasServiceTerms ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'content-location-terms',
      category: 'content',
      severity: 'info',
      title: 'Location-related language',
      whatWeFound: evidence.hasLocationTerms ? 'Your homepage mentions a location or service area.' : 'No clear location-related language was found on your homepage.',
      whyItMatters: 'For a local business, telling visitors (and search engines) where you are or who you serve is a basic, easy trust signal.',
      recommendedAction: evidence.hasLocationTerms ? 'Nothing to do here.' : 'If this applies to you, consider mentioning your location or service area explicitly.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.hasLocationTerms ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'content-contact-info',
      category: 'content',
      severity: evidence.hasContactInfo ? 'good' : 'warning',
      title: 'Contact information present',
      whatWeFound: evidence.hasContactInfo ? 'Your homepage has visible contact information.' : 'No clear contact information was found on your homepage.',
      whyItMatters: 'Without visible contact information, a ready customer has no obvious way to reach you.',
      recommendedAction: evidence.hasContactInfo ? 'Nothing to do here.' : 'Add a phone number, WhatsApp link, or contact form somewhere visible.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.hasContactInfo ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'content-cta',
      category: 'content',
      severity: evidence.hasCta ? 'good' : 'warning',
      title: 'Call-to-action presence',
      whatWeFound: evidence.hasCta ? 'Your homepage has a clear call-to-action.' : 'No clear call-to-action was found on your homepage.',
      whyItMatters: "Every page should give a ready visitor one obvious next step — without one, interest has nowhere to go.",
      recommendedAction: evidence.hasCta ? 'Nothing to do here.' : 'Add a clear, prominent call-to-action (Call, WhatsApp, Book, or Contact).',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.hasCta ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'content-clear-proposition',
      category: 'content',
      severity: evidence.hasClearProposition ? 'good' : 'info',
      title: 'Clear business proposition',
      whatWeFound: evidence.hasClearProposition ? 'Your homepage has a main heading plus enough supporting text to explain what you offer.' : 'Your homepage may be missing enough context for a first-time visitor to quickly understand what you offer.',
      whyItMatters: 'A first-time visitor typically decides whether to stay or leave within a few seconds — a clear, immediate statement of what you do helps.',
      recommendedAction: evidence.hasClearProposition ? 'Nothing to do here.' : 'Consider adding a clear headline and a sentence or two explaining what you offer, near the top of the page.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.hasClearProposition ? 'PASS' : 'PARTIAL',
    },
  ]
}
