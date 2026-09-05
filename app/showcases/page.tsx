import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { ShowcaseGrid } from '@/components/showcases/ShowcaseGrid'
import { getAllContent } from '@/lib/content'

export const metadata = buildMetadata({
  title: 'Showcases',
  description: 'Real Forge client sites.',
  path: '/showcases',
})

export default function ShowcasesPage() {
  const entries = getAllContent('showcases')

  return (
    <>
      <PageHero
        eyebrow="Showcases"
        title="Real client work."
        description="Every showcase here needs the client's explicit consent to be named and shown — see docs/forge-business-rules.md §16 (Human Decision #8) before publishing a real one."
      />
      <Section className="pt-0">
        <ShowcaseGrid entries={entries} />
      </Section>
    </>
  )
}
