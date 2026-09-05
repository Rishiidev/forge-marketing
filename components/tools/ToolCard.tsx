import Link from 'next/link'
import type { ToolDefinition } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="focus-ring block rounded-2xl border border-border bg-white p-6 transition-colors duration-200 ease-forge hover:border-border-strong"
    >
      <div className="mb-2 flex items-center gap-2">
        <Heading as="h3" size="heading-sm">
          {tool.name}
        </Heading>
        {tool.status === 'planned' && <Badge tone="warning">Planned</Badge>}
      </div>
      <Text size="body-sm">{tool.description}</Text>
    </Link>
  )
}
