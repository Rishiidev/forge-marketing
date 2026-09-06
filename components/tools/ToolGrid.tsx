import { getAvailableTools } from '@/lib/tools/registry'
import { ToolCard } from './ToolCard'
import { ToolEmptyState } from './ToolEmptyState'

export function ToolGrid() {
  const tools = getAvailableTools()

  if (tools.length === 0) {
    return (
      <ToolEmptyState message="No interactive tools are live yet. This section is scaffolded and ready — add an entry to lib/constants.ts (TOOLS) once one is built against the engine in docs/tool-architecture.md." />
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  )
}
