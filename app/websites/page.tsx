import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { PricingTierGrid } from '@/components/pricing/PricingTierGrid'

export const metadata = buildMetadata({
  title: 'Websites',
  description: 'Three website tiers for local businesses — see what is included in each.',
  path: '/websites',
})

export default function WebsitesPage() {
  return (
    <>
      <PageHero
        eyebrow="Websites"
        title="Three tiers, one process."
        description="Every tier starts with your Google Business Profile. Pricing and inclusions are sourced from docs/forge-business-rules.md — the ₹25,000 tier is marked pending confirmation, not invented."
      />
      <Section className="pt-0">
        <PricingTierGrid />
      </Section>
    </>
  )
}
