import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { buildMetadata } from '@/lib/seo'
import { getAllContent, getContentBySlug } from '@/lib/content'
import { Section } from '@/components/ui/Section'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllContent('showcases').map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const entry = getContentBySlug('showcases', slug)
  if (!entry) return buildMetadata({ title: 'Showcase not found', description: '', path: `/showcases/${slug}` })

  return buildMetadata({
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    path: `/showcases/${slug}`,
  })
}

export default async function ShowcasePage({ params }: PageProps) {
  const { slug } = await params
  const entry = getContentBySlug('showcases', slug)
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
