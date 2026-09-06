import type { ToolCostClassification, ToolDataSource } from '@/lib/tools/types'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

/**
 * Honest, visitor-facing translation of each ToolCostClassification —
 * never the internal enum name itself, and never phrased in a way that
 * could read as more (or less) certain than what actually happened.
 * This is the tool-level half of the honesty contract lib/tools/results.ts
 * enforces per-finding: a visitor should be able to tell, in plain
 * language, whether a given fact was actually checked or just computed
 * from what they said.
 */
const SOURCE_EXPLAINER: Record<ToolCostClassification, string> = {
  FREE_INTERNAL: 'Computed entirely from what you told us — nothing looked up externally.',
  FREE_EXTERNAL_API: 'Checked live against a public source.',
  CUSTOMER_AUTHORIZED: 'Checked using an account or link you gave us, used only for this check.',
  PAID_NOT_ALLOWED: 'Not used — Forge does not use paid data providers.',
  UNAVAILABLE: "Not available — there's no free way to check this yet, so this tool doesn't guess.",
}

/**
 * "How this works" — every tool's own honest data-source list, plus
 * optional free-form methodology copy. Not an accordion (unlike
 * ToolFAQ) — this is the transparency section, worth being visible by
 * default, not tucked behind a click.
 */
export function ToolMethodology({ methodology, dataSources }: { methodology?: string; dataSources: ToolDataSource[] }) {
  return (
    <Card>
      <Heading as="h2" size="heading-sm" className="mb-4">
        How this works
      </Heading>
      {methodology && (
        <Text size="body" className="mb-5">
          {methodology}
        </Text>
      )}
      <ul className="grid gap-4">
        {dataSources.map((source) => (
          <li key={source.id}>
            <Text size="body-sm" className="font-semibold text-ink">
              {source.name}
            </Text>
            <Text size="body-sm">{SOURCE_EXPLAINER[source.costClassification]}</Text>
          </li>
        ))}
      </ul>
    </Card>
  )
}
