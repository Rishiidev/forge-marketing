import { notFound } from 'next/navigation'
import NextLink from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { buildMetadata, jsonLdScript } from '@/lib/seo'
import { getAllShowcases, getShowcaseBySlug } from '@/lib/showcases'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Metric } from '@/components/marketing/Metric'
import { Review } from '@/components/marketing/Review'
import { TrackedCtaLink } from '@/components/conversion/TrackedCtaLink'
import { ShowcaseViewTracker } from '@/components/showcases/ShowcaseViewTracker'
import { AUDIT_HREF, AUDIT_CTA_LABEL } from '@/lib/constants'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllShowcases().map((showcase) => ({ slug: showcase.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const showcase = getShowcaseBySlug(slug)
  if (!showcase) return buildMetadata({ title: 'Showcase not found', description: '', path: `/showcases/${slug}` })

  return buildMetadata({
    title: showcase.fm.name,
    description: showcase.fm.description,
    path: `/showcases/${slug}`,
    ogImage: showcase.fm.featuredImage,
  })
}

export default async function ShowcasePage({ params }: PageProps) {
  const { slug } = await params
  const showcase = getShowcaseBySlug(slug)
  if (!showcase) notFound()

  const { fm, content } = showcase
  const hasReview = Boolean(fm.review && fm.reviewAuthor)
  const hasMetrics = Boolean(fm.metrics && fm.metrics.length > 0)
  const hasScreenshots = Boolean(fm.screenshots && fm.screenshots.length > 0)

  // Structured data for SEO — every field is a direct copy of real
  // frontmatter, never invented, and omitted (not stubbed) when absent.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `${fm.name} — Forge showcase`,
    description: fm.description,
    ...(fm.launchDate ? { datePublished: fm.launchDate } : {}),
    about: {
      '@type': 'LocalBusiness',
      name: fm.name,
      ...(fm.location ? { address: fm.location } : {}),
      url: fm.websiteUrl,
    },
    ...(hasReview
      ? {
          review: {
            '@type': 'Review',
            reviewBody: fm.review,
            author: { '@type': 'Person', name: fm.reviewAuthor },
            ...(fm.reviewRating ? { reviewRating: { '@type': 'Rating', ratingValue: fm.reviewRating } } : {}),
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <ShowcaseViewTracker slug={slug} />

      {/* 1. Hero */}
      <Section spacing="tight" className="pb-6">
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge>{fm.industry}</Badge>
            {fm.location && (
              <Text as="span" size="body-sm" className="text-muted-2">
                {fm.location}
              </Text>
            )}
          </div>
          <Heading as="h1" size="heading-xl">
            {fm.name}
          </Heading>
          <Text size="body-lg" className="mt-5">
            {fm.description}
          </Text>
        </div>
      </Section>

      {/* 2. Business context */}
      <Section spacing="tight" className="pt-0">
        <dl className="grid gap-6 border-y border-border py-6 sm:grid-cols-3">
          <div>
            <Text as="dt" size="caption">
              Industry
            </Text>
            <dd className="mt-1 text-body text-ink">{fm.industry}</dd>
          </div>
          {fm.location && (
            <div>
              <Text as="dt" size="caption">
                Location
              </Text>
              <dd className="mt-1 text-body text-ink">{fm.location}</dd>
            </div>
          )}
          {fm.launchDate && (
            <div>
              <Text as="dt" size="caption">
                Launched
              </Text>
              <dd className="mt-1 text-body text-ink">{fm.launchDate}</dd>
            </div>
          )}
        </dl>
      </Section>

      {/* 3. The problem / starting point */}
      {fm.problem && (
        <Section spacing="tight">
          <Text as="span" size="caption" className="mb-3 block text-ground">
            Starting point
          </Text>
          <Heading as="h2" size="heading-md" className="max-w-2xl">
            {fm.problem}
          </Heading>
        </Section>
      )}

      {/* 4. Website showcase */}
      <Section spacing="tight" className="bg-paper-2">
        <Text as="span" size="caption" className="mb-4 block text-ground">
          The website
        </Text>
        {fm.featuredImage ? (
          <div
            role="img"
            aria-label={`${fm.name} website`}
            className="h-72 w-full rounded-2xl bg-cover bg-center sm:h-96"
            style={{ backgroundImage: `url(${fm.featuredImage})` }}
          />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white text-center">
            <Text size="body-sm">No screenshot published yet.</Text>
            <a
              href={fm.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded-sm text-body-sm font-semibold text-ground underline-offset-4 hover:underline"
            >
              Visit the live site to see it ↗
            </a>
          </div>
        )}
        {hasScreenshots && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fm.screenshots!.map((src) => (
              <div
                key={src}
                role="img"
                aria-label={`${fm.name} screenshot`}
                className="h-48 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        )}
      </Section>

      {/* 5. What Forge built */}
      <Section spacing="tight">
        <Text as="span" size="caption" className="mb-4 block text-ground">
          What Forge built
        </Text>
        {fm.solution && (
          <Text size="body-lg" className="max-w-2xl">
            {fm.solution}
          </Text>
        )}
        {fm.services && fm.services.length > 0 && (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {fm.services.map((service) => (
              <li key={service} className="flex gap-2 text-body-sm text-ink-3">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                {service}
              </li>
            ))}
          </ul>
        )}
        {content && (
          <article className="prose prose-neutral mt-8 max-w-2xl">
            <MDXRemote source={content} />
          </article>
        )}
      </Section>

      {/* 6. Customer review — only when a real, named review exists */}
      {hasReview && (
        <Section spacing="tight" className="bg-paper-2">
          <Text as="span" size="caption" className="mb-4 block text-ground">
            In their words
          </Text>
          <div className="max-w-md">
            <Review rating={fm.reviewRating ?? 5} text={fm.review!} author={fm.reviewAuthor!} source={fm.reviewRole} />
          </div>
        </Section>
      )}

      {/* 7. Optional verified metrics */}
      {hasMetrics && (
        <Section spacing="tight">
          <Text as="span" size="caption" className="mb-4 block text-ground">
            Verified results
          </Text>
          <div className="grid max-w-md grid-cols-2 gap-6">
            {fm.metrics!.map((metric, i) => (
              // Index, not label — labels aren't guaranteed unique across future entries.
              <Metric key={i} value={metric.value} label={metric.label} />
            ))}
          </div>
        </Section>
      )}

      <Divider />

      {/* 7.5. Free tools mention — links this showcase back toward /tools,
          the one direction the 2026-09-07 SEO audit found nothing pointed. */}
      <Section spacing="tight" className="text-center">
        <Text size="body-sm">
          Curious how your own site compares?{' '}
          <NextLink href="/tools/website-health-check" className="font-semibold text-ground underline-offset-4 hover:underline">
            Run the free Website Health Check
          </NextLink>
          .
        </Text>
      </Section>

      {/* 8 & 9. Live website CTA + free audit CTA */}
      <Section className="bg-ground text-mark">
        <div className="mx-auto max-w-content text-center">
          <Heading as="h2" size="heading-lg" className="text-mark">
            Could Forge do this for your business?
          </Heading>
          <Text size="body-lg" tone="onDarkMuted" className="mx-auto mt-5 max-w-content">
            {fm.name}&rsquo;s site started as a Google Business Profile link — the same place yours would start.
          </Text>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href={fm.websiteUrl} variant="onDark" size="lg" target="_blank" rel="noopener noreferrer">
              Visit the live site ↗
            </Button>
            <TrackedCtaLink href={AUDIT_HREF} location={`showcase-${slug}`} variant="onDarkSecondary" size="lg">
              {AUDIT_CTA_LABEL}
            </TrackedCtaLink>
          </div>
        </div>
      </Section>
    </>
  )
}
