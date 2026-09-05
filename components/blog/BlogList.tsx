import type { ContentEntry } from '@/lib/content'
import { BlogCard } from './BlogCard'

export function BlogList({ entries }: { entries: ContentEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No posts published yet.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <BlogCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
