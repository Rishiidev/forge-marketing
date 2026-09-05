import Link from 'next/link'
import type { Showcase } from '@/lib/showcases'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

/**
 * The one showcase grid card — used on both the homepage and /showcases.
 * Per the showcase-system brief: business, industry, image, short
 * description, review excerpt if available, CTA. Full proof (problem,
 * solution, services, metrics, live link) lives on the detail page this
 * links to, not here.
 *
 * `featuredImage` renders as a CSS background rather than <img>/next/image
 * — none of the current real showcases have one yet, and an arbitrary
 * future client-hosted URL shouldn't require next.config.mjs image-domain
 * changes just to display a card.
 */
export function ShowcaseCard({ showcase }: { showcase: Showcase }) {
  const { fm, slug } = showcase

  return (
    <Link
      href={`/showcases/${slug}`}
      className="focus-ring group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-colors duration-200 ease-forge hover:border-border-strong"
    >
      {fm.featuredImage ? (
        <div
          role="img"
          aria-label={`${fm.name} website preview`}
          className="h-44 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${fm.featuredImage})` }}
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-paper-2">
          <Text as="span" size="caption" className="text-muted-2">
            {fm.industry}
          </Text>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge>{fm.industry}</Badge>
          {fm.location && (
            <Text as="span" size="body-sm" className="text-muted-2">
              {fm.location}
            </Text>
          )}
        </div>

        <Heading as="h3" size="heading-sm">
          {fm.name}
        </Heading>

        <Text size="body-sm" className="mt-2">
          {fm.description}
        </Text>

        {fm.review && (
          <Text size="body-sm" className="mt-4 italic text-ink-3">
            &ldquo;{fm.review}&rdquo;
          </Text>
        )}

        <span className="mt-auto pt-4 text-body-sm font-semibold text-ground">View showcase →</span>
      </div>
    </Link>
  )
}
