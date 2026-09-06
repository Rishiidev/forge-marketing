import type { ToolDefinition } from '@/lib/tools/types'
import { TOOL_CATEGORY_LABEL } from '@/lib/tools/types'
import { PageHero } from '@/components/marketing/PageHero'
import { Text } from '@/components/ui/Text'

/** Every tool page's header — category eyebrow, name, and its visitor-facing `intent` line, reusing the site-wide PageHero rather than a tool-specific hero component. */
export function ToolHeader({ tool }: { tool: ToolDefinition }) {
  return (
    <PageHero eyebrow={TOOL_CATEGORY_LABEL[tool.category]} title={tool.name} description={tool.description}>
      <Text size="body" className="mt-2">
        {tool.intent}
      </Text>
    </PageHero>
  )
}
