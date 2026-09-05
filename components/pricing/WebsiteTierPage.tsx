import { notFound } from 'next/navigation'
import { getWebsiteTier, type WebsiteTierSlug, AUDIT_HREF } from '@/lib/constants'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { Divider } from '@/components/ui/Divider'
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
      <PageHero eyebrow="Website" title={tier.priceLabel} description={tier.tagline}>
        {isTbd && (
          <div className="mt-4">
            <Badge tone="warning">This tier is pending confirmation — see docs/forge-business-rules.md</Badge>
          </div>
        )}
        <div className="mt-8">
          <Button href={AUDIT_HREF} size="lg">
            {isTbd ? 'Ask about this tier' : 'Start with the free audit'}
          </Button>
        </div>
      </PageHero>

      <Section spacing="tight" className="grid gap-10 pt-0 md:grid-cols-2">
        <div>
          <Text as="h2" size="caption" className="mb-4">
            Included
          </Text>
          {tier.included.length > 0 ? (
            <ul className="grid gap-3 text-body-sm text-ink-3">
              {tier.included.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-success">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <Text size="body-sm">Not specified — see {tier.sourceNote}</Text>
          )}
        </div>
        <div>
          <Text as="h2" size="caption" className="mb-4">
            Delivery &amp; revisions
          </Text>
          <dl className="grid gap-4 text-body-sm text-ink-3">
            <div>
              <Text as="dt" size="caption" className="mb-0.5">
                Delivery time
              </Text>
              <dd>{tier.deliveryTime}</dd>
            </div>
            <div>
              <Text as="dt" size="caption" className="mb-0.5">
                Revision policy
              </Text>
              <dd>{tier.revisionPolicy}</dd>
            </div>
            {tier.price !== null && (
              <div>
                <Text as="dt" size="caption" className="mb-0.5">
                  Price
                </Text>
                <dd>{formatINR(tier.price)}</dd>
              </div>
            )}
          </dl>
        </div>
      </Section>

      <Divider />
      <Text size="caption" className="py-6 text-center font-normal normal-case tracking-normal">
        Source: {tier.sourceNote}
      </Text>
    </>
  )
}
