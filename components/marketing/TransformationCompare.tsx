import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'

/**
 * Static before/after comparison — deliberately not the legacy drag-to-
 * compare slider (that needs a range input + client JS to redraw a
 * clip-path on every input event). A side-by-side comparison makes the
 * same point without paying for interactivity nobody needs to operate.
 * Server Component, zero JS.
 *
 * "Studio Mysa" is the same illustrative example business used
 * throughout the legacy codebase for this exact purpose — a mockup of
 * the mechanism, not a claimed real client. Real clients are the
 * Showcases section (components/showcases/ShowcaseProofCard.tsx), never
 * this one.
 */
export function TransformationCompare() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-border md:grid-cols-2">
      <div className="bg-white p-7">
        <Badge>Before — Google Business Profile</Badge>
        <Text as="p" size="body-sm" className="mt-4">
          Information is real, but scattered — a visitor has to piece it together themselves.
        </Text>
        <dl className="mt-5 grid gap-3 text-body-sm">
          <Row label="Business name" value="Studio Mysa" />
          <Row label="Photos" value="86 available" />
          <Row label="Reviews" value="4.8 (86)" />
          <Row label="Services" value="12 listed" />
          <Row label="Next action" value="Not obvious" warn />
        </dl>
      </div>
      <div className="bg-ground p-7 text-mark">
        <Badge tone="success">After — your Forge website</Badge>
        <Text as="p" size="body-sm" tone="onDarkMuted" className="mt-4">
          The same real information, now with one clear next step.
        </Text>
        <div className="mt-5 rounded-xl bg-ground-2 p-5">
          <p className="font-serif text-heading-sm italic text-mark">Good hair days start here.</p>
          <Text size="body-sm" tone="onDarkMuted" className="mt-2">
            Thoughtful cuts, colour, and styling for the way you actually live.
          </Text>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-mark px-3 py-1.5 text-caption font-semibold text-ground">
              WhatsApp to book
            </span>
            <span className="rounded-full bg-mark/15 px-3 py-1.5 text-caption font-semibold text-mark">
              Services
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 text-ink-3">
      <span className="text-muted">{label}</span>
      <strong className={warn ? 'text-warm' : 'text-ink'}>{value}</strong>
    </div>
  )
}
