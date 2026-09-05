import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { MAINTENANCE_PLANS, MAINTENANCE_CLIENT_CAP, AUDIT_HREF } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

export const metadata = buildMetadata({
  title: 'Maintenance',
  description: 'Ongoing management of your website after launch — hosting, updates, and monitoring.',
  path: '/maintenance',
})

export default function MaintenancePage() {
  return (
    <>
      <PageHero
        eyebrow="Maintenance"
        title="For businesses that have outgrown a one-time website."
        description={`Capped at ${MAINTENANCE_CLIENT_CAP} active clients. Cancel any month. This pricing structure (docs/forge-business-rules.md §9) is the more fully documented of two conflicting numbers found in the source codebase — see Human Decision #3 before treating it as final.`}
      />
      <Section spacing="tight" className="pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          {MAINTENANCE_PLANS.map((plan) => (
            <Card
              key={plan.id}
              elevation={plan.featured ? 'raised' : 'flat'}
              className="flex flex-col"
              data-featured={plan.featured}
            >
              <div className="mb-2 flex items-center gap-2">
                <Text as="span" size="caption">
                  {plan.name}
                </Text>
                {plan.featured && <Badge tone="success">Most businesses</Badge>}
              </div>
              <Heading as="p" size="heading-md" className="mb-4">
                {plan.priceLabel}
              </Heading>
              <Text size="body-sm" className="mb-6">
                {plan.tagline}
              </Text>
              <ul className="mb-6 grid gap-2 border-t border-border pt-5 text-body-sm text-ink-3">
                {plan.included.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-success">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button href={AUDIT_HREF} variant="secondary" className="mt-auto w-full justify-center">
                Talk to Forge
              </Button>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
