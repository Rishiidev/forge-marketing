import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { ToolGrid } from '@/components/tools/ToolGrid'

export const metadata = buildMetadata({
  title: 'Tools',
  description: 'Free interactive tools for local businesses.',
  path: '/tools',
})

export default function ToolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Tools"
        title="Free tools, no signup."
        description="Nothing is live here yet — this route is scaffolded and ready for the first tool. See lib/constants.ts (TOOLS)."
      />
      <Section className="pt-0">
        <ToolGrid />
      </Section>
    </>
  )
}
