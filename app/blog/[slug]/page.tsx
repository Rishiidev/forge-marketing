import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { buildMetadata } from '@/lib/seo'
import { getAllContent, getContentBySlug } from '@/lib/content'
import { Section } from '@/components/ui/Section'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllContent('blog').map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const entry = getContentBySlug('blog', slug)
  if (!entry) return buildMetadata({ title: 'Post not found', description: '', path: `/blog/${slug}` })

  return buildMetadata({
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    path: `/blog/${slug}`,
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const entry = getContentBySlug('blog', slug)
  if (!entry) notFound()

  return (
    <Section>
      <article className="prose prose-neutral max-w-2xl">
        <h1>{entry.frontmatter.title}</h1>
        <MDXRemote source={entry.content} />
      </article>
    </Section>
  )
}
