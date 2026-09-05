import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/**
 * Filesystem-backed MDX content loader for content/blog and
 * content/showcases.
 *
 * Not one of the five lib files named in the rebuild brief
 * (constants/analytics/crm/seo/utils) — added because "MDX for content"
 * needs somewhere to live, and it didn't belong in utils.ts (too
 * content-domain-specific) or seo.ts. Logged in docs/decisions.md.
 *
 * This is deliberately not a CMS: it reads .mdx files straight off disk
 * at build/request time. That's the whole content layer — no database,
 * no admin UI, no external service. See docs/architecture.md.
 */

export type ContentCollection = 'blog' | 'showcases'

export interface ContentFrontmatter {
  title: string
  description: string
  date: string
  slug: string
  [key: string]: unknown
}

export interface ContentEntry {
  slug: string
  frontmatter: ContentFrontmatter
  content: string
}

const CONTENT_ROOT = path.join(process.cwd(), 'content')

function collectionDir(collection: ContentCollection): string {
  return path.join(CONTENT_ROOT, collection)
}

export function getContentSlugs(collection: ContentCollection): string[] {
  const dir = collectionDir(collection)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
}

export function getContentBySlug(collection: ContentCollection, slug: string): ContentEntry | null {
  const filePath = path.join(collectionDir(collection), `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf8')
  const { content, data } = matter(raw)

  return {
    slug,
    content,
    frontmatter: { slug, ...data } as ContentFrontmatter,
  }
}

export function getAllContent(collection: ContentCollection): ContentEntry[] {
  return getContentSlugs(collection)
    .map((slug) => getContentBySlug(collection, slug))
    .filter((entry): entry is ContentEntry => entry !== null)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
}
