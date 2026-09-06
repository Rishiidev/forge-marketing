import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { TOOLS } from '@/lib/constants'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Only a genuinely available tool gets a real, pre-rendered page — a
// 'planned'/'unavailable'/'future-paid' tool must never resolve to a
// live route that implies it can be used today. See
// docs/tools-cost-policy.md §I.
function findAvailableTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug && t.status === 'available')
}

export function generateStaticParams() {
  return TOOLS.filter((tool) => tool.status === 'available').map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tool = findAvailableTool(slug)
  return buildMetadata({
    title: tool?.name ?? 'Tool not found',
    description: tool?.description ?? '',
    path: `/tools/${slug}`,
  })
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const tool = findAvailableTool(slug)
  if (!tool) notFound()

  return (
    <Section>
      <Heading as="h1" size="heading-md">
        {tool.name}
      </Heading>
      <Text className="mt-4">{tool.description}</Text>
    </Section>
  )
}
