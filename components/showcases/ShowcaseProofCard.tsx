import type { ContentEntry, ContentFrontmatter } from '@/lib/content'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Link } from '@/components/ui/Link'

/**
 * Frontmatter shape for content/showcases/*.mdx real client entries.
 * `rating`/`reviewCount` are omitted entirely when no real aggregate
 * rating exists for that client — never filled with an invented number.
 */
export interface ShowcaseFrontmatter extends ContentFrontmatter {
  business: string
  category: string
  /** Omitted, not guessed, when the source material doesn't name a city. */
  city?: string
  liveUrl: string
  outcome: string
  rating?: number
  reviewCount?: number
}

function asShowcase(entry: ContentEntry): ShowcaseFrontmatter {
  return entry.frontmatter as ShowcaseFrontmatter
}

/**
 * One real client, all in one place: business + work + context + review
 * (when a real one exists) + live link — per
 * docs/conversion-architecture.md's explicit instruction not to separate
 * this proof across multiple components. Server Component: a live link
 * is a plain anchor, nothing here needs client JS.
 */
export function ShowcaseProofCard({ entry }: { entry: ContentEntry }) {
  const fm = asShowcase(entry)

  return (
    <article className="rounded-2xl border border-border bg-white p-7">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge>{fm.category}</Badge>
        {fm.city && (
          <Text as="span" size="body-sm" className="text-muted-2">
            {fm.city}
          </Text>
        )}
      </div>

      <Heading as="h3" size="heading-sm">
        {fm.business}
      </Heading>

      <Text size="body" className="mt-3">
        {fm.description}
      </Text>

      <div className="mt-5 grid gap-2 border-t border-border pt-5">
        <Text as="span" size="body-sm" className="text-ink-3">
          {fm.outcome}
        </Text>
        {fm.rating && (
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-warm">
              {'★'.repeat(Math.round(fm.rating))}
              <span className="text-muted-2">{'★'.repeat(5 - Math.round(fm.rating))}</span>
            </span>
            <Text as="span" size="body-sm">
              {fm.rating.toFixed(1)} on Google{fm.reviewCount ? ` (${fm.reviewCount} reviews)` : ''}
            </Text>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link href={`/showcases/${entry.slug}`}>Read the full story</Link>
        <a
          href={fm.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-sm text-body-sm font-semibold text-ground underline-offset-4 hover:underline"
        >
          Visit the live site ↗
        </a>
      </div>
    </article>
  )
}
