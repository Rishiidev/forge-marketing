import { CTA } from '@/components/marketing/CTA'
import { Button } from '@/components/ui/Button'
import { TrackedCtaLink } from '@/components/conversion/TrackedCtaLink'
import { AUDIT_HREF, AUDIT_CTA_LABEL } from '@/lib/constants'

interface ArticleCTAProps {
  slug: string
  heading?: string
  description?: string
  /** A relevant next step more specific than the audit — a tool, a tier page, showcases. Optional; omit for a plain audit-only CTA. */
  secondaryHref?: string
  secondaryLabel?: string
}

/**
 * The one CTA every article ends with. Deliberately not "BUY NOW": the
 * chain is useful article → a more relevant next step (when one exists
 * for the topic) → the free audit → Forge. `secondaryHref` lets a post
 * point at whatever's actually relevant to it (e.g. a Growth-tier post
 * links to /websites/15000); the audit is always the primary action
 * because it's the one step every visitor can take regardless of topic.
 */
export function ArticleCTA({
  slug,
  heading = 'See where your own business stands',
  description = "This is general guidance — the free audit looks at your specific Google Business Profile and website, and tells you exactly what to fix first.",
  secondaryHref,
  secondaryLabel,
}: ArticleCTAProps) {
  return (
    <CTA title={heading} description={description}>
      <TrackedCtaLink href={AUDIT_HREF} location={`blog-${slug}`} variant="onDark" size="lg">
        {AUDIT_CTA_LABEL}
      </TrackedCtaLink>
      {secondaryHref && secondaryLabel && (
        <Button href={secondaryHref} variant="onDarkSecondary" size="lg">
          {secondaryLabel}
        </Button>
      )}
    </CTA>
  )
}
