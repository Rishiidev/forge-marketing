import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { Section } from '@/components/ui/Section'
import { ToolGrid } from '@/components/tools/ToolGrid'

export const metadata = buildMetadata({
  title: 'Free Website Tools',
  description: 'Check your homepage\'s SEO, mobile-friendliness, security headers, and more — 12 free, instant tools. No signup, no email required.',
  path: '/tools',
})

export default function ToolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Tools"
        title="Free tools, no signup."
        description="12 real checks against your own homepage — SEO, mobile-friendliness, structured data, security headers, and more. Pick one below, or run the full Website Health Check."
      />
      <Section className="pt-0">
        <ToolGrid />
      </Section>
    </>
  )
}
