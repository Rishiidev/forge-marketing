import { Text } from '@/components/ui/Text'

export interface ProofItem {
  value: string
  label: React.ReactNode
}

/**
 * Proof strip — three real, defensible stats. Replaces the brittle
 * smileCare.fm.metrics?.[0] hack that used to render in this section.
 *
 * The numbers and labels are HARD-CODED here because they are honesty
 * claims, not settings: every claim is defensible per
 * docs/forge-business-rules.md §15. The showcase count (3) is sourced
 * from content/showcases/*.mdx filesystem state — if that ever changes,
 * update the value AND this comment.
 */
const PROOF_ITEMS: ProofItem[] = [
  {
    value: '3',
    label: (
      <>
        Live websites shipped. Every one shown in{' '}
        <a href="#showcases" className="text-ink underline underline-offset-4 hover:text-ground">
          Showcases
        </a>{' '}
        above — real client, real domain.
      </>
    ),
  },
  {
    value: '0',
    label: (
      <>
        Fabricated testimonials. Every claim on this site is defensible in a customer DM. No fake review numbers, ever.
      </>
    ),
  },
  {
    value: '~30 min',
    label: (
      <>
        From your Google Business Profile to a live preview. Not a marketing estimate — what we actually do on the Launch tier.
      </>
    ),
  },
]

export function ProofStrip() {
  return (
    <div className="grid grid-cols-1 gap-8 border-y border-border py-8 sm:grid-cols-3 sm:gap-8">
      {PROOF_ITEMS.map((item, i) => (
        <div key={i} className="text-left">
          <div className="mb-2 text-heading-md font-semibold leading-none tracking-tight text-ink">
            {item.value}
          </div>
          <Text as="p" size="body-sm" className="text-muted">
            {item.label}
          </Text>
        </div>
      ))}
    </div>
  )
}