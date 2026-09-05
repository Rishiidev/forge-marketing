import Link from 'next/link'
import type { ContentEntry } from '@/lib/content'

export function ShowcaseCard({ entry }: { entry: ContentEntry }) {
  return (
    <Link
      href={`/showcases/${entry.slug}`}
      className="block rounded-2xl border border-ink/10 bg-white p-6 transition-colors hover:border-ground/40"
    >
      <h3 className="text-lg font-semibold text-ink">{entry.frontmatter.title}</h3>
      <p className="mt-2 text-sm text-muted">{entry.frontmatter.description}</p>
    </Link>
  )
}
