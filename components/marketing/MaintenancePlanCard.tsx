import type { MaintenancePlan } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'

/**
 * Renders one MaintenancePlan. Mirrors the PriceCard structure:
 * plan name as caption, price as heading, tagline, included list
 * with green checkmark prefix. The featured plan gets a mark-tinted
 * border + "Most chosen" badge.
 */
export function MaintenancePlanCard({
  plan,
  featured = false,
}: {
  plan: MaintenancePlan
  featured?: boolean
}) {
  return (
    <div
      className={
        'rounded-lg border p-5 ' +
        (featured
          ? 'border-mark bg-mark/10'
          : 'border-mark/15 bg-mark/[0.04]')
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Text as="span" size="caption" className="font-semibold uppercase tracking-wide text-mark/80">
          {plan.name}
        </Text>
        {featured && <Badge tone="success">Most chosen</Badge>}
      </div>
      <div className="mb-2 text-heading-sm font-semibold text-mark">{plan.priceLabel}</div>
      <Text as="p" size="body-sm" className="mb-4 text-mark/80">
        {plan.tagline}
      </Text>
      <ul role="list" className="grid gap-2 text-caption text-mark/80">
        {plan.included.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="text-mark-2">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}