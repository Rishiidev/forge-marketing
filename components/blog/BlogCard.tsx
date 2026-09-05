import Link from 'next/link'
import type { ContentEntry } from '@/lib/content'

export function BlogCard({ entry }: { entry: ContentEntry }) {
  return (
    <Link
      href={`/blog/${entry.slug}`}
      className="block rounded-2xl border border-ink/10 bg-white p-6 transition-colors hover:border-ground/40"
    >
      <span className="text-xs uppercase tracking-wide text-muted">{entry.frontmatter.date}</span>
      <h3 className="mt-2 text-lg font-semibold text-ink">{entry.frontmatter.title}</h3>
      <p className="mt-2 text-sm text-muted">{entry.frontmatter.description}</p>
    </Link>
  )
}
