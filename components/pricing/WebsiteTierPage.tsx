import { notFound } from 'next/navigation'
import { getWebsiteTier, type WebsiteTierSlug, AUDIT_HREF, AUDIT_CTA_LABEL, SITE } from '@/lib/constants'
import { jsonLdScript } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Divider } from '@/components/ui/Divider'
import { formatINR } from '@/lib/utils'

/**
 * Shared template rendered by app/websites/5000, /15000, /25000. One
 * template, one data source (lib/constants.ts) — the three routes exist
 * because the brief named them explicitly, not because the content
 * differs in structure. Every tier page covers, in order: what you get,
 * what you don't get, who it's for, the process, timeline/ownership/
 * support, and a CTA at top and bottom — per the commercial brief this
 * was built against (docs/decisions.md ADR-011).
 */
export function WebsiteTierPage({ slug }: { slug: WebsiteTierSlug }) {
  const tier = getWebsiteTier(slug)
  if (!tier) notFound()

  const isTbd = tier.status === 'tbd'

  // Product/Offer schema — only for a real, confirmed price (never for a
  // 'tbd' tier; docs' "never fabricate a fact" convention applies to
  // structured data exactly as much as visible copy). Found missing
  // entirely during the 2026-09-07 SEO audit — these are the site's only
  // pages naming a concrete price, and had zero commercial schema.
  const productJsonLd =
    tier.price !== null
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${tier.name} Website`,
          description: tier.tagline,
          brand: { '@type': 'Brand', name: SITE.name },
          offers: {
            '@type': 'Offer',
            price: tier.price,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: `${SITE.marketingUrl}/websites/${tier.slug}`,
          },
        }
      : null

  return (
    <>
      {productJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd) }} />
      )}
      <PageHero eyebrow="Website" title={`${tier.name} — ${tier.priceLabel}`} description={tier.tagline}>
        {isTbd && (
          <div className="mt-4">
            <Badge tone="warning">This tier is pending confirmation — see docs/forge-business-rules.md</Badge>
          </div>
        )}
        <div className="mt-8">
          <Button href={AUDIT_HREF} size="lg">
            {isTbd ? 'Ask about this tier' : AUDIT_CTA_LABEL}
          </Button>
        </div>
      </PageHero>

      <Section spacing="tight" className="grid gap-10 pt-0 md:grid-cols-2">
        <div>
          <Text as="h2" size="caption" className="mb-4">
            What you get
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
            What you don&apos;t get
          </Text>
          {tier.excluded.length > 0 ? (
            <ul className="grid gap-3 text-body-sm text-ink-3">
              {tier.excluded.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-ink-3">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <Text size="body-sm">Not specified — see {tier.sourceNote}</Text>
          )}
        </div>
      </Section>

      {tier.whoItsFor && (
        <Section spacing="tight" className="pt-0">
          <Card className="max-w-3xl">
            <Text as="h2" size="caption" className="mb-3">
              Who it&apos;s for
            </Text>
            <Text size="body">{tier.whoItsFor}</Text>
          </Card>
        </Section>
      )}

      {tier.process.length > 0 && (
        <Section spacing="tight" className="pt-0">
          <Text as="h2" size="caption" className="mb-5">
            Process
          </Text>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tier.process.map((step, i) => (
              <li key={step} className="rounded-2xl border border-border bg-white p-5">
                <Heading as="span" size="heading-md" className="mb-2 block text-ink-3">
                  {String(i + 1).padStart(2, '0')}
                </Heading>
                <Text size="body-sm">{step}</Text>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section spacing="tight" className="pt-0">
        <Text as="h2" size="caption" className="mb-4">
          Timeline, ownership &amp; support
        </Text>
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-body-sm text-ink-3">
          <div>
            <Text as="dt" size="caption" className="mb-1">
              Delivery
            </Text>
            <dd>{tier.deliveryTime}</dd>
          </div>
          <div>
            <Text as="dt" size="caption" className="mb-1">
              Revisions
            </Text>
            <dd>{tier.revisionPolicy}</dd>
          </div>
          <div>
            <Text as="dt" size="caption" className="mb-1">
              Ownership
            </Text>
            <dd>{tier.ownership}</dd>
          </div>
          <div>
            <Text as="dt" size="caption" className="mb-1">
              Support
            </Text>
            <dd>{tier.support}</dd>
          </div>
          {tier.price !== null && (
            <div>
              <Text as="dt" size="caption" className="mb-1">
                Price
              </Text>
              <dd>{formatINR(tier.price)}</dd>
            </div>
          )}
        </dl>
      </Section>

      <Section spacing="tight" className="pt-0 text-center">
        <Button href={AUDIT_HREF} size="lg">
          {isTbd ? 'Ask about this tier' : AUDIT_CTA_LABEL}
        </Button>
      </Section>

      <Divider />
      <Text size="caption" className="py-6 text-center font-normal normal-case tracking-normal">
        Source: {tier.sourceNote}
      </Text>
    </>
  )
}
