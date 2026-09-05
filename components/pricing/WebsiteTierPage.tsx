import { notFound } from 'next/navigation'
import { getWebsiteTier, type WebsiteTierSlug, AUDIT_HREF } from '@/lib/constants'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatINR } from '@/lib/utils'

/**
 * Shared template rendered by app/websites/5000, /15000, /25000. One
 * template, one data source (lib/constants.ts) — the three routes exist
 * because the brief named them explicitly, not because the content
 * differs in structure.
 */
export function WebsiteTierPage({ slug }: { slug: WebsiteTierSlug }) {
  const tier = getWebsiteTier(slug)
  if (!tier) notFound()

  const isTbd = tier.status === 'tbd'

  return (
    <>
      <PageHero
        eyebrow="Website"
        title={tier.priceLabel}
        description={tier.tagline}
      >
        {isTbd && (
          <div className="mt-4">
            <Badge tone="warning">This tier is pending confirmation — see docs/forge-business-rules.md</Badge>
          </div>
        )}
        <div className="mt-8">
          <Button href={isTbd ? AUDIT_HREF : AUDIT_HREF} size="lg">
            {isTbd ? 'Ask about this tier' : 'Start with the free audit'}
          </Button>
        </div>
      </PageHero>

      <Section className="grid gap-10 pt-0 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Included</h2>
          {tier.included.length > 0 ? (
            <ul className="grid gap-3 text-[15px] text-ink-3">
              {tier.included.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-success">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Not specified — see {tier.sourceNote}</p>
          )}
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Delivery &amp; revisions</h2>
          <dl className="grid gap-4 text-[15px] text-ink-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Delivery time</dt>
              <dd>{tier.deliveryTime}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Revision policy</dt>
              <dd>{tier.revisionPolicy}</dd>
            </div>
            {tier.price !== null && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Price</dt>
                <dd>{formatINR(tier.price)}</dd>
              </div>
            )}
          </dl>
        </div>
      </Section>

      <p className="border-t border-ink/10 py-6 text-center text-xs text-muted">
        Source: {tier.sourceNote}
      </p>
    </>
  )
}
