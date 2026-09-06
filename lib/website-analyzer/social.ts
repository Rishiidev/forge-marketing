import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'

/**
 * Outbound social profile links (Facebook/Instagram/LinkedIn/X/YouTube)
 * — distinct from lib/website-analyzer/metadata.ts's Open Graph/Twitter
 * *card* tags, which control how a link looks when *this page* is
 * shared elsewhere, not where this page links *out to*. No overlap in
 * what each module reads for.
 */

const SOCIAL_PLATFORMS: { id: string; label: string; pattern: RegExp }[] = [
  { id: 'facebook', label: 'Facebook', pattern: /facebook\.com/i },
  { id: 'instagram', label: 'Instagram', pattern: /instagram\.com/i },
  { id: 'linkedin', label: 'LinkedIn', pattern: /linkedin\.com/i },
  { id: 'x', label: 'X (Twitter)', pattern: /(twitter\.com|x\.com)/i },
  { id: 'youtube', label: 'YouTube', pattern: /youtube\.com/i },
]

export interface SocialEvidence {
  foundPlatforms: string[]
}

export function analyzeSocialLinks($: ParsedDocument): SocialEvidence {
  const hrefs = $('a[href]')
    .toArray()
    .map((el) => $(el).attr('href') ?? '')

  const foundPlatforms = SOCIAL_PLATFORMS.filter((platform) => hrefs.some((href) => platform.pattern.test(href))).map((platform) => platform.label)

  return { foundPlatforms }
}

export function buildSocialFindings(evidence: SocialEvidence): Finding[] {
  return [
    {
      id: 'social-profile-links',
      category: 'social',
      severity: evidence.foundPlatforms.length > 0 ? 'good' : 'info',
      title: 'Social profile links',
      whatWeFound: evidence.foundPlatforms.length > 0 ? `Found links to your profile on: ${evidence.foundPlatforms.join(', ')}.` : 'No links to a social media profile were found on your homepage.',
      whyItMatters: "Linking to an active social profile gives a visitor another way to check you're a real, active business — especially useful for a visitor who isn't ready to call yet.",
      recommendedAction: evidence.foundPlatforms.length > 0 ? 'Nothing to do here.' : 'If you maintain a social profile, consider linking to it from your homepage.',
      evidence: { platforms: evidence.foundPlatforms },
      confidence: 'verified',
      status: evidence.foundPlatforms.length > 0 ? 'FOUND' : 'NOT_FOUND',
    },
  ]
}
