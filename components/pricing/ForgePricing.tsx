import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Text'
import { PricingTierGrid } from './PricingTierGrid'
import { DecisionAid } from './DecisionAid'

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

      <DecisionAid />
    </Section>
  )
}