import Link from 'next/link'
import type { ToolDefinition } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="block rounded-2xl border border-ink/10 bg-white p-6 transition-colors hover:border-ground/40"
    >
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-lg font-semibold text-ink">{tool.name}</h3>
        {tool.status === 'planned' && <Badge tone="warning">Planned</Badge>}
      </div>
      <p className="text-sm text-muted">{tool.description}</p>
    </Link>
  )
}
