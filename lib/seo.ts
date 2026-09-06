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

/**
 * Safe-serializes a structured-data object for a `<script type="application/
 * ld+json">` tag. `JSON.stringify()` alone doesn't escape `<`, so a literal
 * `</script>` inside any field (a showcase/blog frontmatter value, however
 * unlikely) would terminate the script tag early and let the text after it
 * run as HTML/script. Escaping `<` as `<` is the standard fix and is
 * invisible to any JSON-LD consumer. Found during a pre-launch security
 * pass, 2026-09-06 — every current source is site-authored MDX frontmatter,
 * not visitor input, so this is defense-in-depth, not a fix for an active
 * exploit.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

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
    // Plain title, not `${title} — ${SITE.name}` — app/layout.tsx's
    // title.template ('%s — Forge') already appends the site name to
    // every page title. Appending it here too produced a doubled
    // "Page — Forge — Forge" on every single page (found during a
    // first-impression audit, 2026-09-06 — the browser tab is the very
    // first thing a visitor sees, before any page content loads).
    title,
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
