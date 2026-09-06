import Link from 'next/link'
import { buildMetadata, buildBreadcrumbJsonLd, jsonLdScript } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { BlogList } from '@/components/blog/BlogList'
import { getAllPosts, BLOG_CATEGORIES } from '@/lib/blog'
import { cn } from '@/lib/utils'

export const metadata = buildMetadata({
  title: 'Blog',
  description: 'Straight answers on Google Business Profile, local SEO, business websites, and getting found online — from Forge.',
  path: '/blog',
})

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { category } = await searchParams
  const allPosts = getAllPosts()
  const activeCategory = category && BLOG_CATEGORIES.includes(category as (typeof BLOG_CATEGORIES)[number]) ? category : undefined
  const posts = activeCategory ? allPosts.filter((post) => post.fm.category === activeCategory) : allPosts

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildBreadcrumbJsonLd(breadcrumbItems)) }}
      />
      <Section spacing="tight" className="pb-0">
        <Breadcrumbs items={breadcrumbItems} />
      </Section>
      <PageHero
        eyebrow="Blog"
        title="Real answers, not filler."
        description="Google Business Profile, local SEO, websites, reviews, and getting found online — written to answer the question a visitor actually typed in, not to fill a URL."
      />
      <Section className="pt-0">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={cn(
              'focus-ring rounded-full border px-4 py-1.5 text-body-sm transition-colors',
              !activeCategory ? 'border-ground bg-ground text-mark' : 'border-border text-ink-3 hover:border-border-strong'
            )}
          >
            All
          </Link>
          {BLOG_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className={cn(
                'focus-ring rounded-full border px-4 py-1.5 text-body-sm transition-colors',
                activeCategory === cat ? 'border-ground bg-ground text-mark' : 'border-border text-ink-3 hover:border-border-strong'
              )}
            >
              {cat}
            </Link>
          ))}
        </div>
        <BlogList posts={posts} />
      </Section>
    </>
  )
}
