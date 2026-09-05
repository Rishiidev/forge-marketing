import type { ContentEntry } from '@/lib/content'
import { Text } from '@/components/ui/Text'
import { BlogCard } from './BlogCard'

export function BlogList({ entries }: { entries: ContentEntry[] }) {
  if (entries.length === 0) {
    return <Text size="body-sm">No posts published yet.</Text>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <BlogCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
