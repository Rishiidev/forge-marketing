import { summarizeByCategory } from '@/lib/tools/results'
import type { ToolFinding, ToolResultCategory } from '@/lib/tools/types'
import { Text } from '@/components/ui/Text'

const ORDER: ToolResultCategory[] = ['verified', 'inferred', 'unavailable', 'not_checked', 'failed']
const LABEL: Record<ToolResultCategory, string> = {
  verified: 'verified',
  inferred: 'estimated',
  unavailable: 'not available',
  not_checked: 'not checked',
  failed: 'failed',
}

/**
 * A plain-language count by resultCategory — deliberately never a single
 * fabricated numeric score (the same rule lib/audit.ts's
 * computeAuditResult() already follows: "there is deliberately no
 * single numeric score"). Reads e.g. "6 verified, 2 estimated, 1 not
 * available — 9 checked."
 */
export function ToolScore({ findings }: { findings: ToolFinding[] }) {
  const counts = summarizeByCategory(findings)
  const parts = ORDER.filter((category) => counts[category] > 0).map((category) => `${counts[category]} ${LABEL[category]}`)
  if (parts.length === 0) return null

  return (
    <Text size="body-lg">
      {parts.join(', ')} — {findings.length} checked in total.
    </Text>
  )
}
