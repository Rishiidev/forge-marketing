import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/lib/blog'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

/** Grid card used by /blog and RelatedArticles — one card design for every blog listing context. */
export function BlogCard({ post }: { post: BlogPost }) {
  const { fm } = post

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="focus-ring flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-colors duration-200 ease-forge hover:border-border-strong"
    >
      {fm.featuredImage && (
        <div className="relative h-40 w-full bg-paper-2">
          <Image src={fm.featuredImage} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge>{fm.category}</Badge>
          <Text as="span" size="caption" className="font-normal normal-case tracking-normal">
            {fm.date}
          </Text>
        </div>
        <Heading as="h3" size="heading-sm">
          {fm.title}
        </Heading>
        <Text size="body-sm" className="mt-2 flex-1">
          {fm.description}
        </Text>
        <Text size="caption" className="mt-4 font-normal normal-case tracking-normal">
          {fm.author}
        </Text>
      </div>
    </Link>
  )
}
