import { Text } from '@/components/ui/Text'

/**
 * The generic "honestly nothing here" state — reused wherever the tools
 * platform has nothing real to show rather than faking content:
 * components/tools/ToolGrid.tsx (no tools live yet),
 * components/tools/ToolFindingList.tsx (a run produced zero findings),
 * components/tools/RelatedTools.tsx (nothing related exists — though
 * that one renders nothing at all rather than even this, since an empty
 * "related tools" section isn't worth a visitor's attention the way an
 * empty results list is).
 */
export function ToolEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Text size="body-sm">{message}</Text>
    </div>
  )
}
