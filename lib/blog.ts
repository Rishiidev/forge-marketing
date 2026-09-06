import type { ContentEntry, ContentFrontmatter } from './content'
import { getAllContent, getContentBySlug } from './content'
import { slugify } from './utils'

/**
 * Blog domain layer, on top of the generic content.ts loader — same
 * justification as lib/showcases.ts (ADR-002/ADR-008): a typed
 * frontmatter shape and filtering/relation logic shared across
 * `/blog`, `/blog/[slug]`, and the homepage, so adding a post never
 * means touching a page or component. See docs/decisions.md ADR-014.
 */

/**
 * The nine topic clusters the blog is scoped to. A closed list, not a
 * free-text field — every post's `category` must be one of these, so
 * `/blog`'s category filter and internal linking stay coherent instead
 * of accumulating one-off categories over time.
 */
export const BLOG_CATEGORIES = [
  'Google Business Profile',
  'Local SEO',
  'Business websites',
  'Online credibility',
  'Reviews',
  'Website conversion',
  'Lead generation',
  'Local marketing',
  'Digital presence',
] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export interface BlogFrontmatter extends ContentFrontmatter {
  title: string
  description: string
  date: string
  author: string
  category: BlogCategory
  tags: string[]
  /** Path under /public, or an external URL. Omitted (not stubbed) when no real image exists. */
  featuredImage?: string
  /**
   * Optional per-post override for the ArticleCTA's secondary link — the
   * "relevant tool" step in article → tool → audit → Forge. Lets a new
   * post point at whatever's actually relevant to it (a tier page, a
   * showcase, a future tool) purely through frontmatter, with no page or
   * component change required. Both or neither — a href with no label
   * (or vice versa) is treated as unset.
   */
  ctaHref?: string
  ctaLabel?: string
}

export interface BlogPost {
  slug: string
  content: string
  fm: BlogFrontmatter
}

function toPost(entry: ContentEntry): BlogPost {
  return { slug: entry.slug, content: entry.content, fm: entry.frontmatter as BlogFrontmatter }
}

/**
 * A post is publishable once it carries the minimum real facts a page
 * needs: title, description, date, author, and a valid category. Tags
 * and a featured image are optional and only ever rendered when present
 * — same "no field defaulted to a placeholder" rule as showcases.
 */
function isPublishable(fm: BlogFrontmatter): boolean {
  return Boolean(fm.title && fm.description && fm.date && fm.author && BLOG_CATEGORIES.includes(fm.category))
}

export function getAllPosts(): BlogPost[] {
  return getAllContent('blog')
    .map(toPost)
    .filter((post) => isPublishable(post.fm))
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((post) => post.fm.category === category)
}

export function getPostBySlug(slug: string): BlogPost | null {
  const entry = getContentBySlug('blog', slug)
  if (!entry) return null
  const post = toPost(entry)
  return isPublishable(post.fm) ? post : null
}

/**
 * Internal linking, not decoration: every post links onward to other
 * relevant posts, scored by shared category (weighted higher — same
 * topic cluster) then shared tags, excluding itself. Falls back to the
 * most recent other posts if nothing scores above zero, so the section
 * never renders empty once a second post exists.
 */
export function getRelatedPosts(post: BlogPost, max = 3): BlogPost[] {
  const others = getAllPosts().filter((p) => p.slug !== post.slug)

  const scored = others
    .map((candidate) => {
      const sameCategory = candidate.fm.category === post.fm.category ? 2 : 0
      const sharedTags = candidate.fm.tags?.filter((tag) => post.fm.tags?.includes(tag)).length ?? 0
      return { candidate, score: sameCategory + sharedTags }
    })
    .sort((a, b) => b.score - a.score)

  const ranked = scored.filter((s) => s.score > 0).map((s) => s.candidate)
  const fallback = scored.map((s) => s.candidate)

  return (ranked.length > 0 ? ranked : fallback).slice(0, max)
}

/** ~200 words/minute, rounded up — a plain estimate, not a precision claim. */
export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export interface Heading {
  depth: 2 | 3
  text: string
  id: string
}

/**
 * Extracts ## and ### headings from raw MDX for the table of contents.
 * Deliberately a plain regex over markdown source, not a full MDX parse
 * — the only thing needed is heading text and a stable id, and
 * `components/blog/ArticleBody.tsx` generates the same id (via the same
 * `slugify`) when it renders the real heading, so the two never drift
 * apart from running two different parsers.
 */
export function extractHeadings(content: string): Heading[] {
  const matches = [...content.matchAll(/^(#{2,3})\s+(.+)$/gm)]
  const seen = new Map<string, number>()

  return matches.map((match) => {
    const depth = (match[1]?.length ?? 2) as 2 | 3
    const text = (match[2] ?? '').trim()
    const base = slugify(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const id = count === 0 ? base : `${base}-${count}`
    return { depth, text, id }
  })
}
