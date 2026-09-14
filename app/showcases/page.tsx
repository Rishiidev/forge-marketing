import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { ShowcaseGrid } from '@/components/showcases/ShowcaseGrid'
import { getAllShowcases } from '@/lib/showcases'

export const metadata = buildMetadata({
  title: 'Showcases',
  description: 'Real Forge client websites — the business, the problem, what Forge built, and the live result.',
  path: '/showcases',
})

export default function ShowcasesPage() {
  const showcases = getAllShowcases()

  return (
    <>
      <PageHero
        eyebrow="Showcases"
        title="Real client work."
        description="Real work, real sites — client builds and Forge's own products, shown with their actual, checkable details. No invented reviews, names, or results."
      />
      <Section className="pt-0">
        <ShowcaseGrid showcases={showcases} />
      </Section>
    </>
  )
}
