import type { ParsedDocument } from './html-parser'
import { extractVisibleText } from './html-parser'
import type { Finding } from './types'

/**
 * CHECK §11: local-business signals — phone, address, city/service area,
 * business name, opening hours, contact CTA, WhatsApp/Maps links,
 * service descriptions.
 *
 * Every finding here is 'heuristic' confidence and describes only what
 * was found *on the website itself* — never a claim about the business's
 * actual Google Business Profile, which this engine has no access to
 * and never pretends to. Pattern-matching text for a phone number or an
 * address shape is inherently approximate; findings are worded as
 * "looks like"/"may be," never "your phone number is."
 */

const PHONE_PATTERN = /(\+?\d[\d\s\-().]{7,}\d)/g
const OPENING_HOURS_PATTERN = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*[-–—]\s*(mon|tue|wed|thu|fri|sat|sun)?[a-z]*[\s:,]*\d{1,2}(:\d{2})?\s*(am|pm)/i
const ADDRESS_SHAPE_PATTERN = /\b\d{1,5}\s+[A-Za-z0-9.\s]{3,40}(street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|block|sector|marg|nagar)\b/i
const SERVICE_AREA_PATTERN = /\b(serving|service area|areas we serve|we serve|proudly serving)\b/i
const CONTACT_CTA_PATTERN = /\b(call now|call us|contact us|book now|book a|get a quote|whatsapp us|message us|schedule (a|an))\b/i
const SERVICE_SECTION_PATTERN = /\b(services?|what we (offer|do)|our (services|offerings))\b/i

export interface LocalSignalsContext {
  title: string | null
  h1Text: string | null
  headingTexts: string[]
}

export interface LocalSignalsEvidence {
  phoneFound: boolean
  phoneExamples: string[]
  addressLikelyFound: boolean
  businessNameGuess: string | null
  openingHoursLikelyFound: boolean
  whatsappLinkCount: number
  googleMapsLinkCount: number
  contactCtaFound: boolean
  serviceAreaMentioned: boolean
  serviceSectionFound: boolean
}

export function analyzeLocalSignals($: ParsedDocument, context: LocalSignalsContext): LocalSignalsEvidence {
  const visibleText = extractVisibleText($)

  const telLinks = $('a[href^="tel:"]')
  const phoneTextMatches = [...visibleText.matchAll(PHONE_PATTERN)].map((m) => m[0].trim())
  const phoneExamples = [...new Set([...telLinks.toArray().map((el) => $(el).attr('href')?.replace(/^tel:/, '') ?? ''), ...phoneTextMatches])].filter(Boolean).slice(0, 3)

  return {
    phoneFound: telLinks.length > 0 || phoneTextMatches.length > 0,
    phoneExamples,
    addressLikelyFound: $('[itemprop="address"], address').length > 0 || ADDRESS_SHAPE_PATTERN.test(visibleText),
    businessNameGuess: context.h1Text || context.title,
    openingHoursLikelyFound: OPENING_HOURS_PATTERN.test(visibleText),
    whatsappLinkCount: $('a[href*="wa.me"], a[href*="api.whatsapp.com"]').length,
    googleMapsLinkCount: $('a[href*="google.com/maps"], a[href*="maps.google."], a[href*="goo.gl/maps"], a[href*="maps.app.goo.gl"]').length,
    contactCtaFound: telLinks.length > 0 || $('a[href*="wa.me"]').length > 0 || CONTACT_CTA_PATTERN.test(visibleText),
    serviceAreaMentioned: SERVICE_AREA_PATTERN.test(visibleText),
    serviceSectionFound: context.headingTexts.some((text) => SERVICE_SECTION_PATTERN.test(text)),
  }
}

export function buildLocalSignalsFindings(evidence: LocalSignalsEvidence): Finding[] {
  return [
    {
      id: 'local-business-name',
      category: 'local-signals',
      severity: evidence.businessNameGuess ? 'good' : 'info',
      title: 'Business name',
      whatWeFound: evidence.businessNameGuess ? `Based on your homepage, your business may be called "${evidence.businessNameGuess}".` : "We couldn't confidently identify a business name from your homepage's heading or title.",
      whyItMatters: 'A clear, consistent business name across your website and your Google Business Profile helps both customers and search engines confirm they\'re the same business.',
      recommendedAction: evidence.businessNameGuess ? 'Worth confirming this exactly matches the name on your Google Business Profile.' : 'Make sure your business name appears clearly in your homepage heading.',
      evidence: { guess: evidence.businessNameGuess },
      confidence: 'heuristic',
      status: evidence.businessNameGuess ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-phone',
      category: 'local-signals',
      severity: evidence.phoneFound ? 'good' : 'warning',
      title: 'Phone number',
      whatWeFound: evidence.phoneFound ? `Found what looks like a phone number on your homepage${evidence.phoneExamples.length ? `: ${evidence.phoneExamples.join(', ')}` : ''}.` : 'No phone number was found on your homepage.',
      whyItMatters: 'A visible phone number is one of the fastest ways a ready customer can reach you — its absence is a real, common source of lost inquiries.',
      recommendedAction: evidence.phoneFound ? 'Nothing to do here.' : 'Add your phone number somewhere visible on the homepage, ideally as a clickable tel: link.',
      evidence: { examples: evidence.phoneExamples },
      confidence: 'heuristic',
      status: evidence.phoneFound ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-address',
      category: 'local-signals',
      severity: evidence.addressLikelyFound ? 'good' : 'info',
      title: 'Address',
      whatWeFound: evidence.addressLikelyFound ? 'Found text on your homepage that looks like a street address.' : "No text that clearly looks like a street address was found on your homepage.",
      whyItMatters: 'A visible address builds trust for a local business, and matching it exactly to your Google Business Profile helps local search rankings.',
      recommendedAction: evidence.addressLikelyFound ? 'Worth confirming it matches your Google Business Profile exactly.' : 'If you serve customers at a physical location, consider adding your address to the homepage.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.addressLikelyFound ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-service-area',
      category: 'local-signals',
      severity: 'info',
      title: 'Service area',
      whatWeFound: evidence.serviceAreaMentioned ? 'Your homepage mentions the area(s) you serve.' : 'No clear mention of a specific service area was found.',
      whyItMatters: 'If you serve a specific city or region rather than operating from one fixed address, saying so explicitly helps both visitors and search engines understand who you serve.',
      recommendedAction: evidence.serviceAreaMentioned ? 'Nothing to do here.' : 'If this applies to you, consider adding a line naming the areas you serve.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.serviceAreaMentioned ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-opening-hours',
      category: 'local-signals',
      severity: evidence.openingHoursLikelyFound ? 'good' : 'info',
      title: 'Opening hours',
      whatWeFound: evidence.openingHoursLikelyFound ? 'Found text on your homepage that looks like opening hours.' : 'No text that clearly looks like opening hours was found.',
      whyItMatters: "Customers often check hours before visiting or calling — having them on your site (matching your Google Business Profile) avoids a wasted trip or call.",
      recommendedAction: evidence.openingHoursLikelyFound ? 'Nothing to do here.' : 'Consider adding your opening hours to the homepage.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.openingHoursLikelyFound ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-contact-cta',
      category: 'local-signals',
      severity: evidence.contactCtaFound ? 'good' : 'warning',
      title: 'Contact call-to-action',
      whatWeFound: evidence.contactCtaFound ? 'Found a clear way to contact you (a phone/WhatsApp link, or contact-style button text).' : 'No clear contact call-to-action was found.',
      whyItMatters: "A visitor who's ready to reach out needs an obvious next step — without one, interest quietly evaporates.",
      recommendedAction: evidence.contactCtaFound ? 'Nothing to do here.' : 'Add a clear, visible "Call", "WhatsApp", or "Contact us" button.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.contactCtaFound ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-whatsapp',
      category: 'local-signals',
      severity: evidence.whatsappLinkCount > 0 ? 'good' : 'info',
      title: 'WhatsApp link',
      whatWeFound: evidence.whatsappLinkCount > 0 ? `Found ${evidence.whatsappLinkCount} WhatsApp link${evidence.whatsappLinkCount > 1 ? 's' : ''} on your homepage.` : 'No WhatsApp link was found.',
      whyItMatters: 'For many local businesses, WhatsApp is the channel customers actually prefer to reach out on.',
      recommendedAction: evidence.whatsappLinkCount > 0 ? 'Nothing to do here.' : 'If you use WhatsApp for business, consider adding a direct WhatsApp link/button.',
      evidence: {},
      confidence: 'verified',
      status: evidence.whatsappLinkCount > 0 ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-google-maps',
      category: 'local-signals',
      severity: evidence.googleMapsLinkCount > 0 ? 'good' : 'info',
      title: 'Google Maps link',
      whatWeFound: evidence.googleMapsLinkCount > 0 ? `Found ${evidence.googleMapsLinkCount} Google Maps link${evidence.googleMapsLinkCount > 1 ? 's' : ''} on your homepage.` : 'No Google Maps link was found.',
      whyItMatters: 'A direct Maps link makes it a one-tap action for a visitor to get directions to you.',
      recommendedAction: evidence.googleMapsLinkCount > 0 ? 'Nothing to do here.' : 'If you have a physical location, consider linking to your Google Maps listing.',
      evidence: {},
      confidence: 'verified',
      status: evidence.googleMapsLinkCount > 0 ? 'FOUND' : 'NOT_FOUND',
    },
    {
      id: 'local-service-descriptions',
      category: 'local-signals',
      severity: evidence.serviceSectionFound ? 'good' : 'info',
      title: 'Service descriptions',
      whatWeFound: evidence.serviceSectionFound ? 'Found a heading that looks like a services/offerings section.' : 'No heading clearly describing your services was found.',
      whyItMatters: 'A visitor should be able to tell what you actually offer within a few seconds of landing on your homepage.',
      recommendedAction: evidence.serviceSectionFound ? 'Nothing to do here.' : 'Add a clearly-labeled section listing what you offer.',
      evidence: {},
      confidence: 'heuristic',
      status: evidence.serviceSectionFound ? 'FOUND' : 'NOT_FOUND',
    },
  ]
}
