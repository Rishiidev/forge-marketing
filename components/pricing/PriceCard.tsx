import type { WebsiteTier } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
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
    <Card elevation={featured ? 'raised' : 'flat'} className="flex flex-col p-8" data-status={tier.status}>
      <div className="mb-3 flex items-center gap-2">
        <Text as="span" size="caption">
          {tier.name}
        </Text>
        {isTbd && <Badge tone="warning">Pending confirmation</Badge>}
        {featured && !isTbd && <Badge tone="success">Recommended</Badge>}
      </div>

      <Heading as="p" size="heading-lg" className="mb-4">
        {tier.priceLabel}
      </Heading>

      <Text size="body" className="mb-6">
        {tier.tagline}
      </Text>

      {tier.included.length > 0 && (
        <ul className="mb-6 flex flex-col gap-3 border-t border-border pt-6 text-body-sm text-ink-3">
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
    </Card>
  )
}
