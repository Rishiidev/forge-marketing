import type { BlogPost } from '@/lib/blog'
import { Text } from '@/components/ui/Text'
import { BlogCard } from './BlogCard'

export function BlogList({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return <Text size="body-sm">No posts in this category yet.</Text>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  )
}
