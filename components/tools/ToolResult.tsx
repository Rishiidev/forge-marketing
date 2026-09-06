import type { ToolDefinition, ToolResult as ToolResultType } from '@/lib/tools/types'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { ToolScore } from './ToolScore'
import { ToolFindingList } from './ToolFindingList'
import { ToolCTA } from './ToolCTA'

/**
 * The 'success'/'partial' execution states — the result shape every
 * tool built on this engine renders the same way: summary, an honest
 * count by resultCategory (never a fabricated single score), the
 * findings themselves, then the tool's own contextual CTA. A 'partial'
 * result (lib/tools/results.ts computeOverallStatus()) still renders
 * everything real it has — the visitor sees what succeeded, plus a
 * plain note about what didn't, never a dead end.
 */
export function ToolResult({ tool, result }: { tool: ToolDefinition; result: ToolResultType }) {
  return (
    <div className="grid gap-12">
      <div>
        <Text as="span" size="caption" className="mb-3 block">
          Your result
        </Text>
        <Heading as="h2" size="heading-lg" className="mb-4">
          {tool.name}
        </Heading>
        <Text size="body-lg" className="mb-2">
          {result.summary}
        </Text>
        <ToolScore findings={result.findings} />
        {result.overallStatus === 'partial' && (
          <Text size="body-sm" className="mt-2 text-warm">
            One part of this check couldn&rsquo;t be completed — see below for what happened.
          </Text>
        )}
        {result.cached && (
          <Text size="caption" className="mt-2">
            Showing a recently cached result.
          </Text>
        )}
      </div>

      <ToolFindingList toolSlug={tool.slug} findings={result.findings} />

      <ToolCTA toolSlug={tool.slug} primary={tool.primaryCTA} secondary={tool.secondaryCTA} />
    </div>
  )
}
