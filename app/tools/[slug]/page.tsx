import { notFound } from 'next/navigation'
import { buildMetadata, buildBreadcrumbJsonLd, jsonLdScript } from '@/lib/seo'
import { getAvailableToolBySlug, getAvailableTools } from '@/lib/tools/registry'
import { Section } from '@/components/ui/Section'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Only a genuinely available tool gets a real, pre-rendered page — a
// 'planned'/'unavailable'/'future-paid' tool must never resolve to a
// live route that implies it can be used today. See
// docs/tools-cost-policy.md §I.
export function generateStaticParams() {
  return getAvailableTools().map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tool = getAvailableToolBySlug(slug)
  if (!tool) return buildMetadata({ title: 'Tool not found', description: '', path: `/tools/${slug}` })

  return buildMetadata({
    title: tool.seo.title,
    description: tool.seo.description,
    path: `/tools/${slug}`,
    ogImage: tool.seo.ogImage,
  })
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const tool = getAvailableToolBySlug(slug)
  if (!tool) notFound()

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools' },
    { name: tool.name, path: `/tools/${slug}` },
  ]

  // WebApplication structured data — every field a direct copy of the
  // tool's own declaration, same "no separate SEO content to keep in
  // sync" rule the showcase/blog structured data already follows.
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

      <ToolPageShell tool={tool} />
    </>
  )
}
