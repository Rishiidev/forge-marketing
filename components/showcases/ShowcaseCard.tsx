import Link from 'next/link'
import type { ContentEntry } from '@/lib/content'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

export function ShowcaseCard({ entry }: { entry: ContentEntry }) {
  return (
    <Link
      href={`/showcases/${entry.slug}`}
      className="focus-ring block rounded-2xl border border-border bg-white p-6 transition-colors duration-200 ease-forge hover:border-border-strong"
    >
      <Heading as="h3" size="heading-sm">
        {entry.frontmatter.title}
      </Heading>
      <Text size="body-sm" className="mt-2">
        {entry.frontmatter.description}
      </Text>
    </Link>
  )
}
