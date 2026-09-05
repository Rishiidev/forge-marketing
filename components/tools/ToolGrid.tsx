import { TOOLS } from '@/lib/constants'
import { ToolCard } from './ToolCard'

export function ToolGrid() {
  if (TOOLS.length === 0) {
    return (
      <p className="text-sm text-muted">
        No interactive tools are live yet. This section is scaffolded and ready — add entries to{' '}
        <code>lib/constants.ts</code> (<code>TOOLS</code>) once one is built.
      </p>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {TOOLS.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  )
}
