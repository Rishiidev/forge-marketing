import type { ContentEntry, ContentFrontmatter } from './content'
import { getAllContent, getContentBySlug } from './content'

/**
 * Showcase domain layer, on top of the generic content.ts loader.
 *
 * Not one of the five lib files named in the rebuild brief, same
 * justification as lib/content.ts (ADR-002): the showcase system needs a
 * `featured`/`draft` filtering rule and a typed frontmatter shape shared
 * by three call sites (homepage, /showcases, /showcases/[slug]). Putting
 * that here — instead of duplicating the filter logic in every page —
 * is what lets the showcase system scale to hundreds of entries without
 * any page implementation changing. Logged as ADR-008.
 */

export interface ShowcaseMetric {
  label: string
  value: string
}

export interface ShowcaseFrontmatter extends ContentFrontmatter {
  name: string
  industry: string
  /** Omitted, not guessed, when the source material doesn't name one. */
  location?: string
  websiteUrl: string
  description: string
  problem?: string
  solution?: string
  services?: string[]
  /**
   * A real, named customer review, only when one exists with consent to
   * publish it. `review`/`reviewAuthor`/`reviewRole`/`reviewRating` are
   * independent of any aggregate platform rating — see `metrics` for
   * that (e.g. a Google Business Profile star average is a real,
   * checkable number, but it isn't a quoted review from a named person).
   *
   * Shaped so a future review-request/approval workflow (see
   * docs/decisions.md ADR-008) can populate these same four fields from
   * a `reviews` record keyed by customer + showcase slug, without a
   * field rename — no such workflow exists yet, on purpose (see brief:
   * "do not build automated review collection now").
   */
  review?: string
  reviewAuthor?: string
  reviewRole?: string
  reviewRating?: number
  screenshots?: string[]
  featuredImage?: string
  /** Free-form, deliberately not a strict date type — real sources here only name a month or a bare year. */
  launchDate?: string
  featured?: boolean
  metrics?: ShowcaseMetric[]
}

export interface Showcase {
  slug: string
  content: string
  fm: ShowcaseFrontmatter
}

function toShowcase(entry: ContentEntry): Showcase {
  return { slug: entry.slug, content: entry.content, fm: entry.frontmatter as ShowcaseFrontmatter }
}

/**
 * A showcase is publishable once it carries the minimum real facts a
 * page needs to render honestly: who, what industry, what it looks like
 * a visitor could check (the live URL), and a description. Everything
 * else (problem/solution/services/review/metrics/images) is optional and
 * only ever rendered when present — see each page for the "only if
 * real data exists" checks.
 */
function isPublishable(fm: ShowcaseFrontmatter): boolean {
  return Boolean(fm.name && fm.industry && fm.websiteUrl && fm.description)
}

export function getAllShowcases(): Showcase[] {
  return getAllContent('showcases')
    .map(toShowcase)
    .filter((showcase) => isPublishable(showcase.fm))
}

/** Homepage use: featured entries first, capped at `max` (brief: "show 3-6 strong showcases"). */
export function getFeaturedShowcases(max = 6): Showcase[] {
  const all = getAllShowcases()
  const featured = all.filter((showcase) => showcase.fm.featured)
  const rest = all.filter((showcase) => !showcase.fm.featured)
  return [...featured, ...rest].slice(0, max)
}

export function getShowcaseBySlug(slug: string): Showcase | null {
  const entry = getContentBySlug('showcases', slug)
  if (!entry) return null
  const showcase = toShowcase(entry)
  return isPublishable(showcase.fm) ? showcase : null
}
