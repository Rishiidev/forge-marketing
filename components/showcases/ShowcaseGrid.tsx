import type { Showcase } from '@/lib/showcases'
import { Text } from '@/components/ui/Text'
import { ShowcaseCard } from './ShowcaseCard'

export function ShowcaseGrid({ showcases }: { showcases: Showcase[] }) {
  if (showcases.length === 0) {
    return <Text size="body-sm">No showcases published yet.</Text>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {showcases.map((showcase) => (
        <ShowcaseCard key={showcase.slug} showcase={showcase} />
      ))}
    </div>
  )
}
