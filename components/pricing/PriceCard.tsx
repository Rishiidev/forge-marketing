import type { WebsiteTier } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/utils'
import { AUDIT_HREF, AUDIT_CTA_LABEL } from '@/lib/constants'

/**
 * Renders one WebsiteTier from lib/constants.ts. Never hard-code a price
 * or feature list in a page — add/edit the tier in lib/constants.ts and
 * every place this card is used (pricing grid, single tier page) updates
 * together.
 *
 * `featured` gets a real visual step up (border, lift, larger price) —
 * not just a badge — because three identically-weighted cards read as
 * "pick any of these," and the ladder has an actual recommended middle
 * tier (docs/decisions.md ADR-011).
 */
export function PriceCard({ tier, featured = false }: { tier: WebsiteTier; featured?: boolean }) {
  const isTbd = tier.status === 'tbd'

  return (
    <Card
      elevation={featured ? 'raised' : 'flat'}
      className={cn(
        'flex flex-col p-8 transition-shadow duration-200 ease-forge',
        featured ? 'border-2 border-ground lg:-translate-y-3 lg:shadow-lg' : 'hover:shadow-sm'
      )}
      data-status={tier.status}
    >
      <div className="mb-3 flex items-center gap-2">
        <Text as="span" size="caption">
          {tier.name}
        </Text>
        {isTbd && <Badge tone="warning">Pending confirmation</Badge>}
        {featured && !isTbd && <Badge tone="success">Recommended</Badge>}
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <Heading as="p" size={featured ? 'heading-xl' : 'heading-lg'}>
          {tier.priceLabel}
        </Heading>
        {tier.price !== null && (
          <Text as="span" size="caption" className="text-ink-3">
            one-time
          </Text>
        )}
      </div>

      <Text size="body" className="mb-4">
        {tier.tagline}
      </Text>

      {!isTbd && (
        <Text size="body-sm" className="mb-6 text-ink-3">
          <Text as="span" size="caption" className="mr-1">
            Best for:
          </Text>
          {tier.bestFor}
        </Text>
      )}

      {tier.included.length > 0 && (
        <div className="mb-6 border-t border-border pt-6">
          <Text as="span" size="caption" className="mb-3 block text-ink-3">
            What&rsquo;s included
          </Text>
          <ul className="flex flex-col gap-3 text-body-sm text-ink-3">
            {tier.included.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-4">
        {isTbd ? (
          <Button href={AUDIT_HREF} variant="secondary" className="w-full justify-center">
            Ask about this tier
          </Button>
        ) : (
          <Button href={AUDIT_HREF} className="w-full justify-center">
            {AUDIT_CTA_LABEL}
          </Button>
        )}
      </div>
    </Card>
  )
}
