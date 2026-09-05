import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { BlogList } from '@/components/blog/BlogList'
import { getAllContent } from '@/lib/content'

export const metadata = buildMetadata({
  title: 'Blog',
  description: 'Notes on local business websites, from Forge.',
  path: '/blog',
})

export default function BlogPage() {
  const entries = getAllContent('blog')

  return (
    <>
      <PageHero eyebrow="Blog" title="Notes from Forge." />
      <Section className="pt-0">
        <BlogList entries={entries} />
      </Section>
    </>
  )
}
