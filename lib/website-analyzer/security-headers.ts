import type { Finding } from './types'

/**
 * CHECK §9: a handful of useful response headers. Each one is reported
 * independently, missing-or-present — "Do not call a site insecure
 * merely because one header is missing" means there is deliberately no
 * rolled-up "your site is insecure" verdict anywhere in this file.
 */

const CHECKED_HEADERS = ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy'] as const

type CheckedHeader = (typeof CHECKED_HEADERS)[number]

const HEADER_EXPLAINER: Record<CheckedHeader, { title: string; whyItMatters: string; recommendedAction: string }> = {
  'strict-transport-security': {
    title: 'Strict-Transport-Security (HSTS)',
    whyItMatters: 'Tells browsers to always use HTTPS for your site, even if a visitor types "http://" by habit — closes a small window where a first request could be intercepted.',
    recommendedAction: 'Ask your host/CDN to add a Strict-Transport-Security header (only worth doing once HTTPS is fully and permanently working).',
  },
  'content-security-policy': {
    title: 'Content-Security-Policy (CSP)',
    whyItMatters: 'Restricts which sources of scripts/styles/images a browser will trust on your page — a real defense against a class of injection attacks, though it takes real, page-specific configuration to get right.',
    recommendedAction: 'A CSP is worth adding once you know exactly which external resources (fonts, analytics, embeds) your site actually loads — get that list first.',
  },
  'x-content-type-options': {
    title: 'X-Content-Type-Options',
    whyItMatters: "Stops a browser from guessing a file's type differently than the server declared — closes a narrow but real attack path.",
    recommendedAction: 'Add "X-Content-Type-Options: nosniff" — this one is safe to add with no site-specific configuration.',
  },
  'referrer-policy': {
    title: 'Referrer-Policy',
    whyItMatters: 'Controls how much of your URL gets sent along when a visitor clicks a link away from your site — affects visitor privacy and what other sites can see about your traffic.',
    recommendedAction: 'Add a Referrer-Policy header (e.g. "strict-origin-when-cross-origin" is a reasonable, safe default).',
  },
  'permissions-policy': {
    title: 'Permissions-Policy',
    whyItMatters: "Lets you explicitly turn off browser features (camera, microphone, location) your site doesn't use — reduces what an embedded/compromised script could ever access.",
    recommendedAction: 'Add a Permissions-Policy header disabling features your site genuinely never uses.',
  },
}

export interface SecurityHeadersEvidence {
  present: Record<CheckedHeader, boolean>
  values: Record<CheckedHeader, string | null>
}

export function extractSecurityHeaders(headers: Record<string, string>): SecurityHeadersEvidence {
  // Headers arrive lowercase already (the Headers API normalizes keys),
  // but normalize defensively in case a caller passes a raw map through.
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) normalized[key.toLowerCase()] = value

  const present = {} as Record<CheckedHeader, boolean>
  const values = {} as Record<CheckedHeader, string | null>
  for (const header of CHECKED_HEADERS) {
    values[header] = normalized[header] ?? null
    present[header] = normalized[header] !== undefined
  }

  return { present, values }
}

export function buildSecurityHeadersFindings(evidence: SecurityHeadersEvidence): Finding[] {
  return CHECKED_HEADERS.map((header) => {
    const isPresent = evidence.present[header]
    const info = HEADER_EXPLAINER[header]
    return {
      id: `security-header-${header}`,
      category: 'security-headers',
      severity: isPresent ? 'good' : 'info',
      title: info.title,
      whatWeFound: isPresent ? `Your site sends the ${info.title.split(' ')[0]} header: "${evidence.values[header]}".` : `Your site does not send a ${info.title.split(' ')[0]} header.`,
      whyItMatters: info.whyItMatters,
      recommendedAction: isPresent ? 'Nothing to do here.' : info.recommendedAction,
      evidence: { value: evidence.values[header] },
      confidence: 'verified',
      status: isPresent ? 'FOUND' : 'NOT_FOUND',
    }
  })
}
