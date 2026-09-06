import type { MetadataRoute } from 'next'
import { SITE, WEBSITE_TIERS, TOOLS } from '@/lib/constants'
import { getAllShowcases } from '@/lib/showcases'
import { getAllPosts } from '@/lib/blog'

/**
 * Native Next.js sitemap (App Router `MetadataRoute.Sitemap`) — served at
 * /sitemap.xml automatically, no separate template to keep in sync.
 * Every entry is either a fixed marketing route or comes straight from
 * the same data functions the pages themselves render from
 * (`getAllShowcases`/`getAllPosts`/`WEBSITE_TIERS`), so a new showcase or
 * blog post appears here the moment its content file exists — nothing
 * to update by hand. `/design-system` (noindex) and `/r/[code]`
 * (a redirect utility, not a page) are deliberately excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE.marketingUrl}${path}`

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    { url: url('/audit'), changeFrequency: 'monthly', priority: 0.9 },
    { url: url('/websites'), changeFrequency: 'monthly', priority: 0.9 },
    { url: url('/maintenance'), changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/showcases'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/tools'), changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/blog'), changeFrequency: 'weekly', priority: 0.8 },
  ]

  const tierRoutes: MetadataRoute.Sitemap = WEBSITE_TIERS.map((tier) => ({
    url: url(`/websites/${tier.slug}`),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const showcaseRoutes: MetadataRoute.Sitemap = getAllShowcases().map((showcase) => ({
    url: url(`/showcases/${showcase.slug}`),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: url(`/blog/${post.slug}`),
    lastModified: post.fm.date,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: url(`/tools/${tool.slug}`),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...tierRoutes, ...showcaseRoutes, ...blogRoutes, ...toolRoutes]
}
