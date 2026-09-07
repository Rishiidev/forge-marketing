import { notFound } from 'next/navigation'
import { buildMetadata, buildBreadcrumbJsonLd, jsonLdScript } from '@/lib/seo'
import { getAvailableToolBySlug } from '@/lib/tools/registry'
import { Section } from '@/components/ui/Section'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { PageSpeedTool } from '@/components/pagespeed/PageSpeedTool'

/**
 * The Forge PageSpeed Test's own static route — takes precedence over
 * the generic `app/tools/[slug]/page.tsx` for this exact path (a
 * standard, supported Next.js App Router resolution rule: a static
 * segment always wins over a dynamic sibling for an exact match), which
 * is what lets this tool have a richer, bespoke UX
 * (components/pagespeed/PageSpeedTool.tsx) while still being a fully
 * registered, registry-consistent tool (lib/pagespeed/tool.ts) for
 * relatedTools/sitemap purposes. See that file's own comment, and
 * app/tools/[slug]/page.tsx's `STATIC_ROUTE_SLUGS` note, for why both
 * sides of this split exist.
 */

export async function generateMetadata() {
  const tool = getAvailableToolBySlug('page-speed-test')
  if (!tool) return buildMetadata({ title: 'Tool not found', description: '', path: '/tools/page-speed-test' })
  return buildMetadata({ title: tool.seo.title, description: tool.seo.description, path: '/tools/page-speed-test', ogImage: tool.seo.ogImage })
}

export default function PageSpeedTestPage() {
  const tool = getAvailableToolBySlug('page-speed-test')
  if (!tool) notFound()

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools' },
    { name: tool.name, path: '/tools/page-speed-test' },
  ]

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.seo.description,
    applicationCategory: 'BusinessApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildBreadcrumbJsonLd(breadcrumbItems)) }}
      />

      <Section spacing="tight" className="pb-0">
        <Breadcrumbs items={breadcrumbItems} />
      </Section>

      <PageSpeedTool tool={tool} />
    </>
  )
}
