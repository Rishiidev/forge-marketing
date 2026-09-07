import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { TrackedCtaLink } from '@/components/conversion/TrackedCtaLink'
import { AUDIT_CTA_LABEL, AUDIT_HREF } from '@/lib/constants'

/**
 * Decision aid — sits below the pricing grid. For visitors who can't
 * tell which tier they need. Tells them they can find out via the
 * audit (free, no obligation) rather than abandoning the page.
 *
 * Tracks the click as `pricing-decision-aid` so conversion data
 * captures the escape hatch's role.
 */
export function DecisionAid() {
  return (
    <div className="mx-auto mt-12 flex max-w-content flex-col items-center gap-3 border-t border-border pt-10 text-center">
      <Heading as="h3" size="heading-sm">
        Not sure which one you need?
      </Heading>
      <Text size="body-sm" className="max-w-[46ch]">
        The free audit looks at your actual Google Business Profile and tells you what your business needs — before you pick a tier.
      </Text>
      <TrackedCtaLink
        href={AUDIT_HREF}
        location="pricing-decision-aid"
        variant="secondary"
        className="mt-2"
      >
        {AUDIT_CTA_LABEL}
      </TrackedCtaLink>
      <Text size="caption" className="mt-4 text-ink-3">
        Every tier above lists exactly what&rsquo;s included and excluded — nothing added later.
      </Text>
    </div>
  )
}