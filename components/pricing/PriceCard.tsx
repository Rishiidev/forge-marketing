import type { WebsiteTier } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AUDIT_HREF } from '@/lib/constants'

/**
 * Renders one WebsiteTier from lib/constants.ts. Never hard-code a price
 * or feature list in a page — add/edit the tier in lib/constants.ts and
 * every place this card is used (pricing grid, single tier page) updates
 * together.
 */
export function PriceCard({ tier, featured = false }: { tier: WebsiteTier; featured?: boolean }) {
  const isTbd = tier.status === 'tbd'

  return (
    <div className="flex flex-col rounded-3xl border border-ink/10 bg-white p-8" data-status={tier.status}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{tier.name}</span>
        {isTbd && <Badge tone="warning">Pending confirmation</Badge>}
        {featured && !isTbd && <Badge tone="success">Recommended</Badge>}
      </div>

      <div className="mb-4 text-5xl font-semibold tracking-tight text-ink">{tier.priceLabel}</div>

      <p className="mb-6 text-[15px] text-muted">{tier.tagline}</p>

      {tier.included.length > 0 && (
        <ul className="mb-6 flex flex-col gap-3 border-t border-ink/10 pt-6 text-sm text-ink-3">
          {tier.included.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-success">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        {isTbd ? (
          <Button href={AUDIT_HREF} variant="secondary" className="w-full justify-center">
            Ask about this tier
          </Button>
        ) : (
          <Button href={AUDIT_HREF} className="w-full justify-center">
            Start with the free audit
          </Button>
        )}
      </div>
    </div>
  )
}
