import type { Metadata } from 'next'
import { SITE } from './constants'

/**
 * Centralized metadata builder.
 *
 * The legacy codebase had wildly inconsistent SEO: canonical tags on 3 of
 * 9 pages, OpenGraph tags on 1 of 9, structured data on 1 of 9
 * (docs/forge-business-rules.md architecture review). Routing every page
 * through this helper is what fixes that going forward — don't hand-write
 * a page's <head> metadata inline.
 */

export interface PageSeoInput {
  title: string
  description: string
  /** Path starting with '/', e.g. '/websites/5000'. */
  path: string
  ogImage?: string
  /** 'article' for blog posts (adds OG article tags below) — every other page stays 'website'. */
  type?: 'website' | 'article'
  /** Article-only. ISO date string from frontmatter. */
  publishedTime?: string
  /** Article-only. Byline, from frontmatter. */
  author?: string
}

export function buildMetadata({ title, description, path, ogImage, type = 'website', publishedTime, author }: PageSeoInput): Metadata {
  const url = `${SITE.marketingUrl}${path}`
  const images = ogImage ? [{ url: ogImage }] : undefined

  return {
    title: `${title} — ${SITE.name}`,
    description,
    alternates: { canonical: url },
    openGraph:
      type === 'article'
        ? {
            title,
            description,
            url,
            siteName: SITE.name,
            type: 'article',
            images,
            ...(publishedTime ? { publishedTime } : {}),
            ...(author ? { authors: [author] } : {}),
          }
        : {
            title,
            description,
            url,
            siteName: SITE.name,
            type: 'website',
            images,
          },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export interface BreadcrumbItem {
  name: string
  /** Path starting with '/'. The last item is the current page and is still given a URL — schema.org requires one per item. */
  path: string
}

/** JSON-LD BreadcrumbList — pair with components/marketing/Breadcrumbs.tsx, which renders the visible trail from the same items. */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE.marketingUrl}${item.path}`,
    })),
  }
}
