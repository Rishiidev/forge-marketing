import type { ToolDefinition } from '@/lib/tools/types'
import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Text'
import { ToolCard } from './ToolCard'

/** Internal linking between tools — same "Related reading" pattern components/blog/RelatedArticles.tsx already establishes for posts. Renders nothing when lib/tools/registry.ts getRelatedTools() has nothing real to show. */
export function RelatedTools({ tools }: { tools: ToolDefinition[] }) {
  if (tools.length === 0) return null

  return (
    <Section spacing="tight" className="pt-0">
      <Text as="h2" size="caption" className="mb-5">
        Related tools
      </Text>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </Section>
  )
}
