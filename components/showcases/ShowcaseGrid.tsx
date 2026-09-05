import type { ContentEntry } from '@/lib/content'
import { Text } from '@/components/ui/Text'
import { ShowcaseCard } from './ShowcaseCard'

export function ShowcaseGrid({ entries }: { entries: ContentEntry[] }) {
  if (entries.length === 0) {
    return <Text size="body-sm">No showcases published yet.</Text>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <ShowcaseCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
