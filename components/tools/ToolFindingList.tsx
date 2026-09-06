import type { ToolFinding as ToolFindingType } from '@/lib/tools/types'
import { ToolFinding } from './ToolFinding'
import { ToolEmptyState } from './ToolEmptyState'

export function ToolFindingList({ toolSlug, findings }: { toolSlug: string; findings: ToolFindingType[] }) {
  if (findings.length === 0) {
    return <ToolEmptyState message="This run didn't produce any findings." />
  }

  return (
    <div className="grid gap-5">
      {findings.map((finding) => (
        <ToolFinding key={finding.id} toolSlug={toolSlug} finding={finding} />
      ))}
    </div>
  )
}
