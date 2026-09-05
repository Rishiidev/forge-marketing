import Link from 'next/link'
import type { ContentEntry } from '@/lib/content'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

export function BlogCard({ entry }: { entry: ContentEntry }) {
  return (
    <Link
      href={`/blog/${entry.slug}`}
      className="focus-ring block rounded-2xl border border-border bg-white p-6 transition-colors duration-200 ease-forge hover:border-border-strong"
    >
      <Text as="span" size="caption" className="font-normal normal-case tracking-normal">
        {entry.frontmatter.date}
      </Text>
      <Heading as="h3" size="heading-sm" className="mt-2">
        {entry.frontmatter.title}
      </Heading>
      <Text size="body-sm" className="mt-2">
        {entry.frontmatter.description}
      </Text>
    </Link>
  )
}
