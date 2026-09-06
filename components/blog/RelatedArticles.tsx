import type { BlogPost } from '@/lib/blog'
import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Text'
import { BlogCard } from './BlogCard'

/** Internal linking between posts — rendered near the end of every article, before the ArticleCTA. */
export function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null

  return (
    <Section spacing="tight" className="pt-0">
      <Text as="h2" size="caption" className="mb-5">
        Related reading
      </Text>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </Section>
  )
}
