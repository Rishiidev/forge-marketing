import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/lib/blog'
import { estimateReadingTime } from '@/lib/blog'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

/** Title, meta row, tags, and optional cover image — the top of every /blog/[slug] page. */
export function ArticleHeader({ post }: { post: BlogPost }) {
  const { fm } = post
  const minutes = estimateReadingTime(post.content)

  return (
    <Section spacing="tight" className="pb-6">
      <div className="max-w-2xl">
        <Link href={`/blog?category=${encodeURIComponent(fm.category)}`}>
          <Badge>{fm.category}</Badge>
        </Link>
        <Heading as="h1" size="heading-xl" className="mt-4">
          {fm.title}
        </Heading>
        <Text size="body-lg" className="mt-5">
          {fm.description}
        </Text>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-3">
          <span>{fm.author}</span>
          <span aria-hidden>·</span>
          <time dateTime={fm.date}>{fm.date}</time>
          <span aria-hidden>·</span>
          <span>{minutes} min read</span>
        </div>
        {fm.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {fm.tags.map((tag) => (
              <Text key={tag} as="span" size="caption" className="rounded-full bg-paper-2 px-3 py-1 font-normal normal-case tracking-normal">
                {tag}
              </Text>
            ))}
          </div>
        )}
      </div>
      {fm.featuredImage && (
        <div className="relative mt-8 h-64 w-full overflow-hidden rounded-2xl bg-paper-2 sm:h-96">
          <Image src={fm.featuredImage} alt={fm.title} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" priority />
        </div>
      )}
    </Section>
  )
}
