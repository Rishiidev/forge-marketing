import { buildMetadata } from '@/lib/seo'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { FeatureList } from '@/components/marketing/FeatureList'
import { Hero } from '@/components/marketing/Hero'
import { TransformationCompare } from '@/components/marketing/TransformationCompare'
import { TrustSignals } from '@/components/marketing/TrustSignals'
import { ProcessSteps } from '@/components/marketing/ProcessStep'
import { Metric } from '@/components/marketing/Metric'
import { FAQ } from '@/components/marketing/FAQ'
import { CTA } from '@/components/marketing/CTA'
import { PricingTierGrid } from '@/components/pricing/PricingTierGrid'
import { AuditForm } from '@/components/audit/AuditForm'
import { ShowcaseCard } from '@/components/showcases/ShowcaseCard'
import { TrackedCtaLink } from '@/components/conversion/TrackedCtaLink'
import { CapacityStrip } from '@/components/conversion/CapacityStrip'
import { getFeaturedShowcases, getShowcaseBySlug } from '@/lib/showcases'
import { AUDIT_CTA_LABEL, AUDIT_HREF, MAINTENANCE_PLANS, CAPACITY } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Forge',
  description:
    'Forge turns your existing Google Business Profile into a professional website that helps customers understand, trust, and contact you.',
  path: '/',
})

// Position 3 — the GBP-input to website-output mapping. Real inputs
// (what every business already has on Google), real outputs (what the
// website does with them) — no invented capability.
const GBP_MAPPING = [
  { title: 'Your photos', description: 'Become your gallery — nothing to reshoot.' },
  { title: 'Your reviews', description: 'Become visible proof, right on your own site.' },
  { title: 'Your services & hours', description: 'Become a clear menu customers can act on.' },
  { title: 'Your location', description: 'Becomes one-tap directions and contact.' },
]

// Position 5 — the missed-opportunity section. Real, defensible framing
// only — no "you're losing ₹X/day" shame copy (docs/forge-business-rules.md §18).
const MISSED_OPPORTUNITY = [
  {
    title: 'Some customers only trust a business with a real website',
    description: 'A Google listing tells them you exist. It does not tell them you are worth their time.',
  },
  {
    title: 'Without a clear next step, they hesitate',
    description: 'And a hesitant customer defaults to whoever looks more finished — not whoever does better work.',
  },
  {
    title: "You're being compared, whether you asked to be or not",
    description: 'Customers weigh you against every competitor who already looks established online.',
  },
  {
    title: "You don't have time to manage a website project",
    description: 'Forge removes the project entirely — you approve, you don’t manage.',
  },
]

// Position 6 — the real ~2min/~30min/~10min/tomorrow flow for the
// Launch tier (docs/forge-business-rules.md §11).
const PROCESS_STEPS = [
  { index: 1, title: 'You send the link', description: 'Your Google Business Profile link — the one thing we need to start.', meta: '~2 min' },
  { index: 2, title: 'We build', description: 'Pulled straight from your profile into an industry-tuned template.', meta: '~30 min' },
  { index: 3, title: 'You review, live', description: 'A real walkthrough call. You decide on the spot — nothing is charged yet.', meta: '~10 min' },
  { index: 4, title: 'We hand over', description: 'Domain, email, everything — set up in your name, not ours.', meta: 'by tomorrow' },
]

// Position 11 — FAQ. Every answer restates an existing, real policy
// (docs/forge-business-rules.md) — nothing here is new copy invented for
// the homepage.
const FAQ_ITEMS = [
  {
    question: 'Do I need to write the website content myself?',
    answer:
      'No. Forge starts with your Google Business Profile and only asks for the few details that are missing. You review the finished site before anything is charged.',
  },
  {
    question: 'Will I own my website and domain?',
    answer:
      'Yes, always. The domain is registered in your name, not Forge’s. Files transfer to you after final payment — you can leave at any time and take everything with you.',
  },
  {
    question: "What if I don't like it?",
    answer:
      'For the Launch tier, you see the finished site live on a walkthrough call before you pay anything. If it is not right, you simply don’t proceed — there is no charge.',
  },
  {
    question: 'Will I get locked into monthly fees?',
    answer:
      'No. The Launch, Growth, and Pro websites are one-time purchases. Ongoing maintenance is a fully separate, optional plan you can cancel any month.',
  },
  {
    question: 'Can you actually build for my type of business?',
    answer:
      'Forge has ready templates for salons, clinics, cafés and restaurants, studios, trade and repair services, and coaches or consultants — see real examples in Showcases below.',
  },
  {
    question: 'What happens after I request the audit?',
    answer:
      'We review your Google Business Profile against 7 specific points and send you a private write-up. There is no upsell inside the audit itself — what you do next is your call.',
  },
  {
    question: 'Does this guarantee more customers?',
    answer:
      'No honest website can guarantee rankings, leads, or revenue, and Forge won’t claim otherwise. What it does is give customers who already find you a clear, trustworthy way to understand and contact you.',
  },
]

export default function HomePage() {
  const featuredShowcases = getFeaturedShowcases(6)
  const smileCare = getShowcaseBySlug('smile-care-dental')

  return (
    <>
      {/* 1. Hero */}
      <Hero />

      {/* 2. Immediate proof / transformation */}
      <Section id="transformation" spacing="tight">
        <div className="mb-8 max-w-content">
          <Text as="span" size="caption" className="mb-3 block text-ground">
            The change
          </Text>
          <Heading as="h2" size="heading-lg">
            Same real information. A different first impression.
          </Heading>
          <Text size="body-lg" className="mt-4">
            This is an illustrative example, not a real client — real client websites are further down, in
            Showcases.
          </Text>
        </div>
        <TransformationCompare />
      </Section>

      {/* 3. GBP -> website explanation */}
      <Section spacing="tight" className="bg-paper-2">
        <div className="mb-8 max-w-content">
          <Heading as="h2" size="heading-lg">
            You already have everything a website needs.
          </Heading>
          <Text size="body-lg" className="mt-4">
            Forge doesn&rsquo;t ask you to write anything from scratch — it works from what your Google Business
            Profile already has.
          </Text>
        </div>
        <FeatureList items={GBP_MAPPING} />
      </Section>

      {/* 4. Free audit — embedded, not just linked */}
      <Section id="audit" spacing="tight" className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <Text as="span" size="caption" className="mb-3 block text-ground">
            Start here — free, no obligation
          </Text>
          <Heading as="h2" size="heading-lg">
            Get your free audit.
          </Heading>
          <Text size="body-lg" className="mt-4">
            A manual, 7-point review of what your Google Business Profile is telling customers today — reviewed
            by a person, not a script. No upsell inside the audit itself.
          </Text>
          <ul className="mt-6 grid gap-2">
            {[
              'The 10-second first impression',
              'How easy you are to contact',
              'Whether your proof reads as a story or looks scattered',
              'What shows up when someone searches your business',
            ].map((line) => (
              <li key={line} className="flex gap-2 text-body-sm text-ink-3">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        <AuditForm />
      </Section>

      {/* 5. Problem / missed opportunity */}
      <Section spacing="tight" className="bg-paper-2">
        <div className="mb-8 max-w-content">
          <Heading as="h2" size="heading-lg">
            You do excellent work. Your online presence may not prove it.
          </Heading>
        </div>
        <div className="grid gap-0 border-t border-border">
          {MISSED_OPPORTUNITY.map((item, i) => (
            <div key={item.title} className="grid grid-cols-[auto_1fr] gap-5 border-b border-border py-6">
              <span className="font-mono text-caption text-muted">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <strong className="block text-body-lg font-semibold text-ink">{item.title}</strong>
                <Text size="body-sm" className="mt-1">
                  {item.description}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <TrackedCtaLink href="#audit" location="problem-section" variant="secondary">
            {AUDIT_CTA_LABEL}
          </TrackedCtaLink>
        </div>
      </Section>

      {/* 6. Forge process */}
      <Section id="process" spacing="tight">
        <div className="mb-10 max-w-content">
          <Text as="span" size="caption" className="mb-3 block text-ground">
            How it works
          </Text>
          <Heading as="h2" size="heading-lg">
            Four steps. Nothing to manage.
          </Heading>
        </div>
        <ProcessSteps steps={PROCESS_STEPS} />
      </Section>

      {/* 7. Showcases — real work only, one combined card each */}
      <Section spacing="tight" className="bg-paper-2">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-content">
            <Text as="span" size="caption" className="mb-3 block text-ground">
              Real work
            </Text>
            <Heading as="h2" size="heading-lg">
              Real businesses, real websites.
            </Heading>
          </div>
          <Button href="/showcases" variant="secondary">
            See all showcases
          </Button>
        </div>
        {featuredShowcases.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {featuredShowcases.map((showcase) => (
              <ShowcaseCard key={showcase.slug} showcase={showcase} />
            ))}
          </div>
        ) : (
          <Text size="body-sm">No showcases published yet.</Text>
        )}
      </Section>

      {/* 8. Pricing ladder */}
      <Section id="pricing" spacing="tight">
        <div className="mb-10 max-w-content">
          <Text as="span" size="caption" className="mb-3 block text-ground">
            Pricing
          </Text>
          <Heading as="h2" size="heading-lg">
            Three tiers. One transparent price each.
          </Heading>
          <Text size="body-lg" className="mt-4">
            Launch is intentionally simple, not stripped down — a complete website, live fast, with nothing to
            negotiate. Growth and Pro add custom design as your needs grow.
          </Text>
        </div>
        <PricingTierGrid />
      </Section>

      {/* 9. Maintenance */}
      <Section spacing="tight" className="bg-ground text-mark">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-content">
            <Text as="span" size="caption" tone="onDark" className="mb-3 block">
              After launch
            </Text>
            <Heading as="h2" size="heading-lg" className="text-mark">
              Keep it working, on a plan you can leave anytime.
            </Heading>
            <Text size="body-lg" tone="onDarkMuted" className="mt-4">
              Websites and maintenance are billed separately, on purpose — maintenance is optional, and cancelling
              never affects what you own.
            </Text>
          </div>
          <Button href="/maintenance" variant="onDark">
            See maintenance plans
          </Button>
        </div>
        <div className="mt-10 grid gap-4 border-t border-mark/15 pt-8 sm:grid-cols-3">
          {MAINTENANCE_PLANS.map((plan) => (
            <div key={plan.id} className="flex items-baseline justify-between gap-4 sm:block">
              <Text as="span" size="caption" tone="onDark">
                {plan.name}
              </Text>
              <p className="text-heading-sm text-mark sm:mt-1">{plan.priceLabel}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 10. Reviews / proof */}
      <Section spacing="tight">
        <div className="mb-10 max-w-content">
          <Heading as="h2" size="heading-lg">
            How we earn your trust.
          </Heading>
          <Text size="body-lg" className="mt-4">
            No fake review counts, no invented numbers — only what is real and checkable.
          </Text>
        </div>

        {smileCare?.fm.metrics?.[0] && (
          <div className="mb-8 max-w-xs">
            <Metric value={smileCare.fm.metrics[0].value} label={`${smileCare.fm.metrics[0].label} · ${smileCare.fm.name}`} />
          </div>
        )}

        <TrustSignals
          items={[
            {
              title: 'See it before you decide',
              description: 'A live preview and a walkthrough call — before you pay anything for a Launch website.',
            },
            {
              title: 'Your domain, always',
              description: 'Registered in your name from day one. Files transfer to you after final payment.',
            },
            {
              title: 'A process you can see',
              description: 'Every step above has a real time estimate — never "we’ll be in touch."',
            },
          ]}
        />
      </Section>

      {/* 11. FAQ */}
      <Section spacing="tight" className="bg-paper-2">
        <div className="mb-8 max-w-content">
          <Heading as="h2" size="heading-lg">
            Nothing hidden.
          </Heading>
        </div>
        <div className="max-w-3xl">
          <FAQ items={FAQ_ITEMS} />
        </div>
      </Section>

      {/* 12. Final CTA */}
      <CTA
        eyebrow="Get started"
        title="Give customers somewhere worth arriving."
        description="Send your Google Business Profile. We'll review it and get back to you — no obligation, no changes to your Google listing."
      >
        <TrackedCtaLink href={AUDIT_HREF} location="final-cta" variant="onDark" size="lg">
          {AUDIT_CTA_LABEL}
        </TrackedCtaLink>
      </CTA>
      {CAPACITY.status === 'confirmed' && (
        <div className="bg-ground pb-16">
          <div className="mx-auto max-w-xs">
            <CapacityStrip />
          </div>
        </div>
      )}
    </>
  )
}
