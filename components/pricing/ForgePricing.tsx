import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Text'
import { TrackedCtaLink } from '@/components/conversion/TrackedCtaLink'
import { AUDIT_CTA_LABEL, AUDIT_HREF } from '@/lib/constants'
import { PricingTierGrid } from './PricingTierGrid'

/**
 * The homepage pricing section. Recognition -> clarity -> comparison ->
 * risk reduction -> choice -> action: heading states what's being
 * decided, PricingTierGrid shows the three real tiers (lib/constants.ts
 * WEBSITE_TIERS — the only place tier data is defined), then a decision
 * aid for the visitor who isn't sure yet, so "which tier" never becomes
 * a reason to leave instead of a reason to talk to Forge.
 */
export function ForgePricing() {
  return (
    <Section id="pricing" spacing="tight">
      <div className="mb-10 max-w-content">
        <Text as="span" size="caption" className="mb-3 block text-ground">
          Pricing
        </Text>
        <Heading as="h2" size="heading-lg">
          Three tiers. One transparent price each.
        </Heading>
        <Text size="body-lg" className="mt-4">
          Launch is intentionally simple, not stripped down — a complete website, live fast, with nothing to
          negotiate. Growth and Pro add custom design as your needs grow.
        </Text>
      </div>

      <PricingTierGrid />

      <div className="mx-auto mt-14 flex max-w-content flex-col items-center gap-3 border-t border-border pt-10 text-center">
        <Heading as="h3" size="heading-sm">
          Not sure which one you need?
        </Heading>
        <Text size="body-sm" className="max-w-[46ch]">
          The free audit looks at your actual Google Business Profile and tells you what your business needs —
          before you pick a tier.
        </Text>
        <TrackedCtaLink href={AUDIT_HREF} location="pricing-decision-aid" variant="secondary" className="mt-2">
          {AUDIT_CTA_LABEL}
        </TrackedCtaLink>
        <Text size="body-sm" className="mt-4 text-ink-3">
          Every tier above lists exactly what&rsquo;s included and excluded — nothing added later.
        </Text>
      </div>
    </Section>
  )
}
