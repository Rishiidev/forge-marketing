import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/marketing/PageHero'
import { FeatureList } from '@/components/marketing/FeatureList'
import { AuditForm } from '@/components/audit/AuditForm'
import { Section } from '@/components/ui/Section'

export const metadata = buildMetadata({
  title: 'Free 7-Point Website Audit',
  description:
    'A free 7-point website audit for local businesses. See what your Google profile is telling customers, and what your website should be telling them.',
  path: '/audit',
})

// Content sourced from legacy/audit.html — docs/forge-business-rules.md §5.
const AUDIT_POINTS = [
  { title: 'The ten-second first impression', description: 'What a customer sees first, and whether it builds trust or hesitation.' },
  { title: 'Contact clarity', description: 'How easy it is to call, WhatsApp, or get directions.' },
  { title: 'Proof and credibility', description: 'Photos, reviews, services, and details — together or scattered.' },
  { title: 'Search readiness', description: 'What shows up when someone searches your business by name or category.' },
  { title: 'Mobile experience', description: 'What your profile and website look like on the phone your customers use.' },
  { title: 'Next-action visibility', description: 'Whether the path to call, message, or visit is obvious within one scroll.' },
  { title: "Trust signals your competitors have", description: 'What businesses appearing above you on Google are doing that you are not.' },
]

export default function AuditPage() {
  return (
    <>
      <PageHero
        eyebrow="Free 7-point website audit"
        title="See what your Google profile is telling customers."
        description="A free, no-obligation, 7-point audit of your Google Business Profile — reviewed by a person, not a software report. No upsell inside the audit itself."
      />
      <Section className="grid gap-12 pt-0 lg:grid-cols-2">
        <FeatureList items={AUDIT_POINTS} />
        <AuditForm />
      </Section>
    </>
  )
}
