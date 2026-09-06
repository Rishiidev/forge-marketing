import { notFound } from 'next/navigation'
import { buildMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { getAllPosts, getPostBySlug, getRelatedPosts, extractHeadings } from '@/lib/blog'
import { SITE } from '@/lib/constants'
import { Section } from '@/components/ui/Section'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { ArticleHeader } from '@/components/blog/ArticleHeader'
import { ArticleBody } from '@/components/blog/ArticleBody'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { RelatedArticles } from '@/components/blog/RelatedArticles'
import { ArticleCTA } from '@/components/blog/ArticleCTA'
import { BlogViewTracker } from '@/components/blog/BlogViewTracker'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return buildMetadata({ title: 'Post not found', description: '', path: `/blog/${slug}` })

  return buildMetadata({
    title: post.fm.title,
    description: post.fm.description,
    path: `/blog/${slug}`,
    ogImage: post.fm.featuredImage,
    type: 'article',
    publishedTime: post.fm.date,
    author: post.fm.author,
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { fm, content } = post
  const headings = extractHeadings(content)
  const related = getRelatedPosts(post)
  const hasCta = Boolean(fm.ctaHref && fm.ctaLabel)

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: fm.title, path: `/blog/${slug}` },
  ]

  // BlogPosting structured data — every field a direct copy of real
  // frontmatter, matching the pattern already used for showcases.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: fm.title,
    description: fm.description,
    datePublished: fm.date,
    author: { '@type': 'Organization', name: fm.author },
    publisher: { '@type': 'Organization', name: SITE.name },
    mainEntityOfPage: `${SITE.marketingUrl}/blog/${slug}`,
    ...(fm.featuredImage ? { image: fm.featuredImage } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }}
      />
      <BlogViewTracker slug={slug} />

      <Section spacing="tight" className="pb-0">
        <Breadcrumbs items={breadcrumbItems} />
      </Section>

      <ArticleHeader post={post} />

      <Section spacing="tight" className="grid gap-10 pt-0 lg:grid-cols-[minmax(0,1fr)_240px]">
        <ArticleBody content={content} />
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents headings={headings} />
          </div>
        </div>
      </Section>

      <RelatedArticles posts={related} />

      <ArticleCTA slug={slug} secondaryHref={hasCta ? fm.ctaHref : undefined} secondaryLabel={hasCta ? fm.ctaLabel : undefined} />
    </>
  )
}
