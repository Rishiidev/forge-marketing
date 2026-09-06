import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { ShaderBackground } from '@/components/ui/test'
import { TrackedCtaLink } from '@/components/conversion/TrackedCtaLink'
import { AUDIT_CTA_LABEL } from '@/lib/constants'

/**
 * The homepage hero. Answers, in order: what is this (headline + supporting
 * line), who it's for (supporting line), what changes (the mockup card),
 * what to do next (primary CTA). No cleverness at the cost of clarity —
 * per the brief.
 *
 * Primary CTA scrolls to the embedded audit form (#audit) further down
 * this same page rather than navigating to /audit — the homepage embeds
 * the real form (section 4), so keeping the visitor on-page is the
 * lower-friction path. /audit still exists for direct/nav traffic.
 */
export function Hero() {
  return (
    // -mt-[68px]/pt-[68px] slides the shader up under SiteHeader's sticky
    // bar (also 68px tall, bg-paper/90 + backdrop-blur) instead of butting
    // up against it — the header's translucency then blends the color in
    // rather than cutting it off with a hard edge.
    <div className="relative -mt-[68px] overflow-hidden pt-[68px]">
      <ShaderBackground className="pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-1/3 bg-gradient-to-b from-transparent to-paper"
      />
      <Section spacing="tight" className="pt-10 md:pt-16" containerClassName="grid items-center gap-12 md:grid-cols-2">
      <div>
        <Heading as="h1" size="heading-xl">
          Your business is already <span className="font-serif italic">trusted</span> offline. Make it look that
          way online.
        </Heading>
        <Text size="body-lg" className="mt-6 max-w-[46ch]">
          Forge turns your existing business information into a professional website that helps customers
          understand, trust, and contact you.
        </Text>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <TrackedCtaLink href="#audit" location="hero" size="lg">
            {AUDIT_CTA_LABEL}
          </TrackedCtaLink>
          <Button href="#process" variant="secondary" size="lg">
            See how it works
          </Button>
        </div>

        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
          {['Preview before you pay', 'No technical setup needed', 'Domain stays in your name'].map((line) => (
            <li key={line} className="flex items-center gap-2 text-body-sm text-muted">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-2 shadow-lg" aria-hidden="true">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-paper-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-paper-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-paper-3" />
          <span className="ml-2 rounded bg-paper-2 px-2 py-0.5 font-mono text-caption text-muted">
            yourbusiness.com
          </span>
        </div>
        <div className="rounded-b-xl bg-ground p-6 text-mark">
          <p className="font-serif text-heading-md italic">Good hair days start here.</p>
          <Text size="body-sm" tone="onDarkMuted" className="mt-3 max-w-[30ch]">
            Thoughtful cuts, colour, and styling for the way you actually live.
          </Text>
          <div className="mt-5 flex gap-2">
            <span className="rounded-full bg-mark px-4 py-2 text-body-sm font-semibold text-ground">
              WhatsApp to book
            </span>
            <span className="rounded-full bg-mark/15 px-4 py-2 text-body-sm font-semibold text-mark">Services</span>
          </div>
        </div>
      </div>
      </Section>
    </div>
  )
}
