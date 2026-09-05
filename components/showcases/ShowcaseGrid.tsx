import type { ContentEntry } from '@/lib/content'
import { ShowcaseCard } from './ShowcaseCard'

export function ShowcaseGrid({ entries }: { entries: ContentEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No showcases published yet.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <ShowcaseCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
