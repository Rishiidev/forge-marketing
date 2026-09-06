import type { Metadata } from 'next'
import * as tokens from '@/lib/design-tokens'

import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Accordion } from '@/components/ui/Accordion'
import { Divider } from '@/components/ui/Divider'

import { CTA } from '@/components/marketing/CTA'
import { FeatureList } from '@/components/marketing/FeatureList'
import { ProcessSteps } from '@/components/marketing/ProcessStep'
import { MetricRow } from '@/components/marketing/Metric'
import { Testimonial } from '@/components/marketing/Testimonial'
import { Review } from '@/components/marketing/Review'
import { FAQ } from '@/components/marketing/FAQ'
import { PriceCard } from '@/components/pricing/PriceCard'
import { BlogCard } from '@/components/blog/BlogCard'
import { ShowcaseCard } from '@/components/showcases/ShowcaseCard'
import { ToolCard } from '@/components/tools/ToolCard'
import { AuditForm } from '@/components/audit/AuditForm'

import { WEBSITE_TIERS } from '@/lib/constants'
import type { Showcase } from '@/lib/showcases'
import type { BlogPost } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Design system — Forge (internal)',
  robots: { index: false, follow: false },
}

const TOC = [
  ['tokens-color', 'Color'],
  ['tokens-type', 'Typography'],
  ['tokens-spacing', 'Spacing & containers'],
  ['tokens-radius', 'Radius'],
  ['tokens-border', 'Borders'],
  ['tokens-shadow', 'Shadows'],
  ['tokens-motion', 'Motion'],
  ['tokens-focus', 'Focus states'],
  ['primitives', 'Primitives'],
  ['marketing', 'Marketing components'],
] as const

function flattenColors(colors: Record<string, unknown>): { name: string; value: string }[] {
  const out: { name: string; value: string }[] = []
  for (const [key, val] of Object.entries(colors)) {
    if (typeof val === 'string') {
      out.push({ name: key, value: val })
    } else if (val && typeof val === 'object') {
      for (const [shade, shadeVal] of Object.entries(val as Record<string, string>)) {
        out.push({ name: shade === 'DEFAULT' ? key : `${key}-${shade}`, value: shadeVal })
      }
    }
  }
  return out
}

// Read directly from lib/design-tokens.ts — the same object
// tailwind.config.ts feeds into Tailwind's theme, so this page can never
// drift from the tokens actually in use.
const swatches = flattenColors(tokens.colors).filter(
  (c) => !['transparent', 'current', 'white', 'black'].includes(c.name)
)
const fontSizeEntries = Object.entries(tokens.fontSize)
const radiusEntries = Object.entries(tokens.borderRadius).filter(([name]) => name !== 'none')
const shadowEntries = Object.entries(tokens.boxShadow).filter(([name]) => name !== 'none')

// Example content only — not read from content/showcases (no real client
// is fabricated for a design-system preview). docs/forge-business-rules.md §16.
const exampleShowcase: Showcase = {
  slug: 'example-showcase',
  content: '',
  fm: {
    title: 'Example showcase',
    description: 'A one-line description of the real work delivered.',
    date: '2026-01-01',
    slug: 'example-showcase',
    name: 'Example Business',
    industry: 'Example industry',
    location: 'Example City',
    websiteUrl: 'https://example.com',
  },
}
// Example content only — not read from content/blog (real posts exist now;
// this preview never depends on any one of them still existing).
const exampleBlog: BlogPost = {
  slug: 'example-post',
  content: '',
  fm: {
    title: 'Example post title',
    description: 'A one-line description of what the post covers.',
    date: '2026-01-01',
    slug: 'example-post',
    author: 'Forge Team',
    category: 'Local SEO',
    tags: ['Example tag'],
  },
}

export default function DesignSystemPage() {
  return (
    <div className="pb-24">
      <Section spacing="tight" className="border-b border-border pb-8">
        <Badge tone="warning">Internal — not indexed, not linked from the public nav</Badge>
        <Heading as="h1" size="heading-xl" className="mt-4">
          Forge design system
        </Heading>
        <Text size="body-lg" className="mt-4 max-w-content">
          Design tokens and every reusable component, rendered from the actual source (
          <code className="text-body-sm">tailwind.config.ts</code>, <code className="text-body-sm">components/</code>
          ) — not a separate spec that can drift from the code. See{' '}
          <code className="text-body-sm">docs/decisions.md</code> ADR-005 for the reasoning behind these choices.
        </Text>
        <nav aria-label="Design system sections" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
          {TOC.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="focus-ring rounded-sm text-body-sm text-muted hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-color">
        <Heading as="h2" size="heading-lg">
          Color
        </Heading>
        <Text className="mt-3 max-w-content">
          Carried forward from the legacy palette. Not a confirmed final brand decision — see
          docs/forge-business-rules.md.
        </Text>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {swatches.map((swatch) => (
            <div key={swatch.name}>
              <div className="h-16 rounded-md border border-border" style={{ backgroundColor: swatch.value }} />
              <p className="mt-2 text-body-sm font-medium text-ink">{swatch.name}</p>
              <p className="font-mono text-caption font-normal normal-case tracking-normal text-muted">
                {swatch.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-type">
        <Heading as="h2" size="heading-lg">
          Typography
        </Heading>
        <Text className="mt-3 max-w-content">
          Named scale, not Tailwind&rsquo;s default text-sm/base/lg ladder. Headings are fluid (clamp) — resize the
          window to see them respond without a breakpoint override.
        </Text>
        <div className="mt-8 grid gap-6">
          {fontSizeEntries.map(([name, value]) => {
            const size = Array.isArray(value) ? value[0] : value
            return (
              <div key={name} className="flex flex-wrap items-baseline gap-4 border-b border-border pb-4">
                <span className="w-32 shrink-0 font-mono text-caption font-normal normal-case tracking-normal text-muted">
                  {name}
                </span>
                <span style={{ fontSize: size }} className="text-ink">
                  Forge it online
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-8 flex flex-wrap gap-8">
          <p className="font-sans text-body">Inter — body text (font-sans)</p>
          <p className="font-serif italic text-body">Fraunces — accent italic (font-serif)</p>
          <p className="font-mono text-body-sm">JetBrains Mono — data / labels (font-mono)</p>
        </div>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-spacing">
        <Heading as="h2" size="heading-lg">
          Spacing &amp; containers
        </Heading>
        <Text className="mt-3 max-w-content">
          Spacing uses Tailwind&rsquo;s default scale (that scale is genuinely generic and doesn&rsquo;t need
          replacing). Section rhythm and container widths are named tokens:
        </Text>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border p-4">
            <dt className="font-mono text-caption font-normal normal-case tracking-normal text-muted">
              Section spacing=&quot;default&quot;
            </dt>
            <dd className="text-body-sm text-ink">clamp(5rem, 11vw, 8.75rem) vertical padding</dd>
          </div>
          <div className="rounded-md border border-border p-4">
            <dt className="font-mono text-caption font-normal normal-case tracking-normal text-muted">
              Section spacing=&quot;tight&quot;
            </dt>
            <dd className="text-body-sm text-ink">clamp(3.5rem, 8vw, 6rem) vertical padding</dd>
          </div>
          <div className="rounded-md border border-border p-4">
            <dt className="font-mono text-caption font-normal normal-case tracking-normal text-muted">
              max-w-wrap
            </dt>
            <dd className="text-body-sm text-ink">1200px — the primary page container</dd>
          </div>
          <div className="rounded-md border border-border p-4">
            <dt className="font-mono text-caption font-normal normal-case tracking-normal text-muted">
              max-w-content
            </dt>
            <dd className="text-body-sm text-ink">720px — article / prose-width content</dd>
          </div>
        </dl>
        <Text size="body-sm" className="mt-6">
          Breakpoints: Tailwind defaults, unchanged — sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px.
        </Text>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-radius">
        <Heading as="h2" size="heading-lg">
          Radius
        </Heading>
        <div className="mt-8 flex flex-wrap gap-6">
          {radiusEntries.map(([name, value]) => (
            <div key={name} className="text-center">
              <div className="h-20 w-20 border-2 border-ground bg-paper-2" style={{ borderRadius: value }} />
              <p className="mt-2 text-body-sm text-ink">{name}</p>
              <p className="text-caption font-normal normal-case tracking-normal text-muted">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-border">
        <Heading as="h2" size="heading-lg">
          Borders
        </Heading>
        <div className="mt-8 flex flex-wrap gap-6">
          <div className="h-20 w-40 rounded-md border border-border bg-white" />
          <div className="h-20 w-40 rounded-md border border-border-strong bg-white" />
        </div>
        <Text size="body-sm" className="mt-3">
          border (default) · border-strong (hover states)
        </Text>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-shadow">
        <Heading as="h2" size="heading-lg">
          Shadows
        </Heading>
        <Text className="mt-3 max-w-content">
          Ground-tinted, not neutral black — a small detail that keeps elevation feeling designed rather than a
          browser default.
        </Text>
        <div className="mt-8 flex flex-wrap gap-8">
          {shadowEntries.map(([name, value]) => (
            <div key={name} className="text-center">
              <div className="h-20 w-32 rounded-md bg-white" style={{ boxShadow: value }} />
              <p className="mt-3 text-body-sm text-ink">shadow-{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-motion">
        <Heading as="h2" size="heading-lg">
          Motion
        </Heading>
        <Text className="mt-3 max-w-content">
          Subtle only: hover/active feedback and expand-collapse feedback. No decorative scroll-triggered reveals —
          see docs/decisions.md ADR-005. Hover the button; open the accordion below.
        </Text>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button>Hover me</Button>
          <Text size="body-sm">transition-[background-color,transform,box-shadow] · ease-forge · 200ms</Text>
        </div>
      </Section>

      <Divider />

      {/* ---------------------------------------------------------------- */}
      <Section spacing="tight" id="tokens-focus">
        <Heading as="h2" size="heading-lg">
          Focus states
        </Heading>
        <Text className="mt-3 max-w-content">
          One rule (<code className="text-body-sm">.focus-ring</code>, globals.css) applied to every interactive
          primitive. Tab to the elements below to see it.
        </Text>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button>Button</Button>
          <Link href="/design-system">Link</Link>
          <Input placeholder="Input" className="max-w-[200px]" />
        </div>
      </Section>

      {/* =================================================================
          PRIMITIVES
          ================================================================= */}
      <Section id="primitives" className="border-t border-border bg-paper-2">
        <Heading as="h2" size="heading-lg">
          Primitives
        </Heading>

        <div className="mt-10 grid gap-10">
          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Container / Section
            </Text>
            <Text size="body-sm">Used on every page (see this page). No visual demo needed beyond that.</Text>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Heading
            </Text>
            <div className="grid gap-3">
              <Heading size="display">Display</Heading>
              <Heading size="heading-xl">Heading XL</Heading>
              <Heading size="heading-lg">Heading LG</Heading>
              <Heading size="heading-md">Heading MD</Heading>
              <Heading size="heading-sm">Heading SM</Heading>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Text
            </Text>
            <div className="grid gap-2">
              <Text size="body-lg">Body LG — for hero/intro paragraphs.</Text>
              <Text size="body">Body — the default paragraph size.</Text>
              <Text size="body-sm">Body SM — secondary copy, card descriptions.</Text>
              <Text size="caption">Caption — eyebrows and labels</Text>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Button
            </Text>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="primary" size="lg">
                Primary large
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-ground p-4">
              <Button variant="onDark">On dark</Button>
              <Button variant="onDarkSecondary">On dark secondary</Button>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Link
            </Text>
            <div className="flex flex-wrap gap-6">
              <Link href="/design-system">Default link (body copy)</Link>
              <Link href="/design-system" variant="quiet">
                Quiet link (nav/footer)
              </Link>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Badge
            </Text>
            <div className="flex flex-wrap gap-3">
              <Badge>Neutral</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="warning">Warning</Badge>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Card
            </Text>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>Flat card (default)</Card>
              <Card elevation="raised">Raised card (soft shadow)</Card>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Input / Textarea / Select
            </Text>
            <div className="grid max-w-md gap-4">
              <Input placeholder="Input" />
              <Textarea placeholder="Textarea" rows={3} />
              <Select defaultValue="">
                <option value="" disabled>
                  Select
                </option>
                <option>Option A</option>
                <option>Option B</option>
              </Select>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Accordion
            </Text>
            <div className="max-w-2xl rounded-2xl border border-border bg-white p-2">
              <Accordion
                items={[
                  { id: 'a', trigger: 'First item', content: 'Its panel expands with a grid-rows transition.' },
                  { id: 'b', trigger: 'Second item', content: 'Opening this closes the first (single-open).' },
                ]}
              />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Divider
            </Text>
            <Divider className="max-w-md" />
          </div>
        </div>
      </Section>

      {/* =================================================================
          MARKETING COMPONENTS
          ================================================================= */}
      <Section id="marketing">
        <Heading as="h2" size="heading-lg">
          Marketing components
        </Heading>
        <Text className="mt-3 max-w-content">
          Navbar and Footer aren&rsquo;t re-demoed here — they&rsquo;re already on every page of this site as
          SiteHeader/SiteFooter (docs/architecture.md).
        </Text>

        <div className="mt-10 grid gap-14">
          <div>
            <Text as="span" size="caption" className="mb-4 block">
              CTA
            </Text>
            <div className="overflow-hidden rounded-2xl">
              <CTA eyebrow="Example" title="One clear next action." description="CTA is a generic dark band — the buttons are whatever the page needs.">
                <Button variant="onDark" href="/audit">
                  Primary action
                </Button>
                <Button variant="onDarkSecondary" href="/websites">
                  Secondary action
                </Button>
              </CTA>
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              PricingCard (PriceCard)
            </Text>
            <div className="grid gap-5 md:grid-cols-3">
              {WEBSITE_TIERS.map((tier) => (
                <PriceCard key={tier.slug} tier={tier} featured={tier.slug === '15000'} />
              ))}
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              FeatureList
            </Text>
            <FeatureList
              items={[
                { title: 'Real proof', description: 'Only real, current data — see the anti-fabrication rule.' },
                { title: 'Specific over hype', description: 'Bounded, checkable claims beat vague reassurance.' },
              ]}
            />
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              ProcessStep
            </Text>
            <ProcessSteps
              steps={[
                { index: 1, title: 'You send the link', description: 'Your Google Business Profile link.', meta: '~2 min' },
                { index: 2, title: 'We build', description: 'Pulled from your profile, industry-tuned template.', meta: '~30 min' },
                { index: 3, title: 'You review', description: 'A live preview before anything is charged.', meta: '~10 min' },
                { index: 4, title: 'We hand over', description: 'Domain, files, everything, in your name.', meta: 'by tomorrow' },
              ]}
            />
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Metric
            </Text>
            <Text size="body-sm" className="mb-3 italic">
              Example values below — no real metrics exist in the codebase yet (docs/forge-business-rules.md §18).
            </Text>
            <div className="max-w-md">
              <MetricRow
                metrics={[
                  { value: '12', label: 'example metric A' },
                  { value: '2.3d', label: 'example metric B' },
                  { value: '100%', label: 'example metric C' },
                ]}
              />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Testimonial
            </Text>
            <Text size="body-sm" className="mb-3 italic">
              Example content only — not a real Forge customer (docs/forge-business-rules.md §15).
            </Text>
            <div className="max-w-lg">
              <Testimonial
                quote="Example placeholder quote — replace with a real customer's words, with consent, or remove this section."
                name="Example Business Owner"
                role="Example Salon, Example City"
              />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              Review
            </Text>
            <Text size="body-sm" className="mb-3 italic">
              Example content only — not a real review (docs/forge-business-rules.md §15).
            </Text>
            <div className="max-w-md">
              <Review rating={5} text="Example placeholder review text." author="Example Reviewer" source="Example source" />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              ShowcaseCard
            </Text>
            <Text size="body-sm" className="mb-3 italic">
              Example content only — not a real client (docs/forge-business-rules.md §16).
            </Text>
            <div className="max-w-sm">
              <ShowcaseCard showcase={exampleShowcase} />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              FAQ
            </Text>
            <div className="max-w-2xl">
              <FAQ
                items={[
                  { question: 'Example question one?', answer: 'Example answer one.' },
                  { question: 'Example question two?', answer: 'Example answer two.' },
                ]}
              />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              BlogCard
            </Text>
            <div className="max-w-sm">
              <BlogCard post={exampleBlog} />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              ToolCard
            </Text>
            <div className="max-w-sm">
              <ToolCard tool={{ slug: 'example', name: 'Example tool', description: 'Example description of a planned tool.', status: 'planned' }} />
            </div>
          </div>

          <div>
            <Text as="span" size="caption" className="mb-4 block">
              AuditForm
            </Text>
            <div className="max-w-lg">
              <AuditForm />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
