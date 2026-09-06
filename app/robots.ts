import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'

/**
 * Native Next.js robots.txt (served at /robots.txt). `/design-system` is
 * deliberately NOT disallowed here — it's already kept out of search
 * results via a page-level `noindex` (app/design-system/page.tsx), and
 * disallowing it in robots.txt would stop a crawler from ever fetching
 * the page to see that noindex tag in the first place. `/r/[code]`
 * (referral redirects) and `/api/*` are disallowed — neither is a page
 * meant to be indexed or crawled.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/r/', '/api/'],
    },
    sitemap: `${SITE.marketingUrl}/sitemap.xml`,
  }
}
