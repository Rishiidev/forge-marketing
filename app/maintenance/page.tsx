import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'
import { MAINTENANCE_PLANS, MAINTENANCE_CLIENT_CAP } from '@/lib/constants'
import { AUDIT_HREF } from '@/lib/constants'
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
      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          {MAINTENANCE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-3xl border border-ink/10 bg-white p-7"
              data-featured={plan.featured}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{plan.name}</span>
                {plan.featured && <Badge tone="success">Most businesses</Badge>}
              </div>
              <div className="mb-4 text-3xl font-semibold tracking-tight text-ink">{plan.priceLabel}</div>
              <p className="mb-6 text-sm text-muted">{plan.tagline}</p>
              <ul className="mb-6 grid gap-2 border-t border-ink/10 pt-5 text-sm text-ink-3">
                {plan.included.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-success">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button href={AUDIT_HREF} variant="secondary" className="mt-auto w-full justify-center">
                Talk to Forge
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
