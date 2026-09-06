import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Text'
import { Link } from '@/components/ui/Link'
import { PricingTierGrid } from '@/components/pricing/PricingTierGrid'
import { PricingComparisonTable } from '@/components/pricing/PricingComparisonTable'
import { TrustSignals } from '@/components/marketing/TrustSignals'
import { ShowcaseGrid } from '@/components/showcases/ShowcaseGrid'
import { getFeaturedShowcases } from '@/lib/showcases'

export const metadata = buildMetadata({
  title: 'Websites',
  description: 'Three website tiers for local businesses, each a genuinely different level of build — see exactly what is included in each.',
  path: '/websites',
})

export default function WebsitesPage() {
  const showcases = getFeaturedShowcases(3)

  return (
    <>
      <PageHero
        eyebrow="Websites"
        title="Three tiers. Not three sizes of the same thing."
        description="Launch gets a real website live today. Growth is a custom-designed site written for your business. Pro adds the pages and conversion engine a busier business needs. Every price, inclusion, and exclusion below is exactly what ships — nothing vaguer than that."
      />

      <Section className="pt-0">
        <PricingTierGrid />
      </Section>

      <Section spacing="tight" className="pt-0">
        <Text as="h2" size="caption" className="mb-5">
          Compare tiers
        </Text>
        <PricingComparisonTable />
      </Section>

      <Section spacing="tight" className="pt-0">
        <TrustSignals
          items={[
            {
              title: 'Pay only when you’re sure',
              description: 'On Launch, you see the finished, live site before you pay anything at all.',
            },
            {
              title: 'You own it, always',
              description: 'The domain is in your name and files transfer to you on final payment — on every tier, no exceptions.',
            },
            {
              title: 'No guessing on scope',
              description: 'Every tier page lists exactly what is and isn’t included. Anything outside that is quoted separately, not assumed.',
            },
          ]}
        />
      </Section>

      {showcases.length > 0 && (
        <Section spacing="tight" className="pt-0">
          <Text as="h2" size="caption" className="mb-5">
            Real Forge websites
          </Text>
          <ShowcaseGrid showcases={showcases} />
          <Text size="body-sm" className="mt-5">
            <Link href="/showcases">See every showcase &rarr;</Link>
          </Text>
        </Section>
      )}

      <Section spacing="tight" className="pt-0 text-center">
        <Text as="h2" size="caption" className="mb-3">
          Not sure what your current site is missing?
        </Text>
        <Text size="body-sm" className="mb-5">
          Run a free, instant check against your homepage before you decide on a tier — SEO, mobile-friendliness, and more.
        </Text>
        <Link href="/tools">See the free tools &rarr;</Link>
      </Section>
    </>
  )
}
