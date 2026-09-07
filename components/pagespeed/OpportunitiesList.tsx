import type { Finding } from '@/lib/website-analyzer/types'
import { toToolFinding } from '@/lib/website-analyzer/types'
import { ToolFindingList } from '@/components/tools/ToolFindingList'
import { ToolEmptyState } from '@/components/tools/ToolEmptyState'

/** The "Biggest opportunities" step (task brief §6) — Lighthouse's own savings-estimated opportunities first, general diagnostics after. Reuses the generic ToolFindingList/ToolFinding rendering (technical-details disclosure included) rather than a bespoke card, since these findings don't need the LAB/FIELD prominence CoreWebVitalsPanel does — every opportunity/diagnostic here is lab data by definition. */
export function OpportunitiesList({ pagespeedFindings }: { pagespeedFindings: Finding[] }) {
  const items = pagespeedFindings.filter((f) => f.id.startsWith('pagespeed-opportunity-') || f.id.startsWith('pagespeed-diagnostic-'))

  if (items.length === 0) {
    return <ToolEmptyState message="No specific opportunities were flagged this run — that's a good sign, or live PageSpeed data wasn't available." />
  }

  return <ToolFindingList toolSlug="page-speed-test" findings={items.map(toToolFinding)} />
}
