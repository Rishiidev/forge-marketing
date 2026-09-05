import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { TOOLS } from '@/lib/constants'
import { Section } from '@/components/ui/Section'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tool = TOOLS.find((t) => t.slug === slug)
  return buildMetadata({
    title: tool?.name ?? 'Tool not found',
    description: tool?.description ?? '',
    path: `/tools/${slug}`,
  })
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const tool = TOOLS.find((t) => t.slug === slug)
  if (!tool) notFound()

  return (
    <Section>
      <h1 className="text-3xl font-semibold text-ink">{tool.name}</h1>
      <p className="mt-4 text-muted">{tool.description}</p>
    </Section>
  )
}
