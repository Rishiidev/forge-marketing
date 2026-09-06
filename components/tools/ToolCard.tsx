import Link from 'next/link'
import type { ToolDefinition } from '@/lib/tools/types'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

/**
 * Status badge shown for a tool that isn't usable yet. A 'future-paid'
 * tool must never read as available — see docs/tools-cost-policy.md §I
 * and lib/tools/cost-policy.ts validateToolDefinition(), which fails the
 * build if one is ever marked status: 'available'.
 */
const UNAVAILABLE_BADGE: Record<Exclude<ToolDefinition['status'], 'available'>, string> = {
  planned: 'Planned',
  unavailable: 'Unavailable',
  'future-paid': 'Not available — requires a paid provider decision',
}

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  if (tool.status !== 'available') {
    const status = tool.status
    return (
      <div className="rounded-2xl border border-border bg-white p-6 opacity-70">
        <div className="mb-2 flex items-center gap-2">
          <Heading as="h3" size="heading-sm">
            {tool.name}
          </Heading>
          <Badge tone="warning">{UNAVAILABLE_BADGE[status]}</Badge>
        </div>
        <Text size="body-sm">{tool.description}</Text>
      </div>
    )
  }

  const card = (
    <>
      <div className="mb-2 flex items-center gap-2">
        <Heading as="h3" size="heading-sm">
          {tool.name}
        </Heading>
      </div>
      <Text size="body-sm">{tool.description}</Text>
    </>
  )

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="focus-ring block rounded-2xl border border-border bg-white p-6 transition-colors duration-200 ease-forge hover:border-border-strong"
    >
      {card}
    </Link>
  )
}
