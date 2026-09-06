import { WEBSITE_TIERS } from '@/lib/constants'
import { formatINR } from '@/lib/utils'
import { Text } from '@/components/ui/Text'

/**
 * Side-by-side comparison of the three website tiers — pricing-psychology
 * "comparison" and "clear differentiation" (see the commercial brief this
 * was built against, docs/decisions.md ADR-011). Every row is a real,
 * sourced fact from lib/constants.ts; nothing here is decorative.
 */
const ROWS: { label: string; get: (tier: (typeof WEBSITE_TIERS)[number]) => string }[] = [
  { label: 'Best for', get: (t) => t.bestFor },
  { label: 'Design', get: (t) => (t.slug === '5000' ? 'Same proven layout for every Launch site' : 'Custom, built for your business') },
  { label: 'Pages', get: (t) => (t.slug === '5000' ? '1' : t.slug === '15000' ? 'Up to 3' : 'Up to 8') },
  {
    label: 'Conversion engine',
    get: (t) => (t.slug === '25000' ? 'Included (service picker, booking, or quote wizard)' : 'Not included'),
  },
  { label: 'Revisions', get: (t) => t.revisionPolicy },
  { label: 'Delivery', get: (t) => t.deliveryTime },
  { label: 'Support after launch', get: (t) => t.support },
  { label: 'Ownership', get: () => 'Domain, files, and logins — always yours' },
  { label: 'Price', get: (t) => (t.price !== null ? formatINR(t.price) : t.priceLabel) },
]

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full min-w-[640px] border-collapse text-body-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="p-5 text-left">
              <Text as="span" size="caption">
                Compare
              </Text>
            </th>
            {WEBSITE_TIERS.map((tier) => (
              <th key={tier.slug} className="p-5 text-left">
                <Text as="span" size="caption">
                  {tier.name}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0">
              <td className="p-5 align-top">
                <Text as="span" size="caption" className="text-ink-3">
                  {row.label}
                </Text>
              </td>
              {WEBSITE_TIERS.map((tier) => (
                <td key={tier.slug} className="p-5 align-top text-ink-3">
                  {row.get(tier)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
