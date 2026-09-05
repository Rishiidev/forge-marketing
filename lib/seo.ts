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
}

export function buildMetadata({ title, description, path, ogImage }: PageSeoInput): Metadata {
  const url = `${SITE.marketingUrl}${path}`
  const images = ogImage ? [{ url: ogImage }] : undefined

  return {
    title: `${title} — ${SITE.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
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
