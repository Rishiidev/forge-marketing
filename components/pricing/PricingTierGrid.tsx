import { WEBSITE_TIERS } from '@/lib/constants'
import { PriceCard } from './PriceCard'

export function PricingTierGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {WEBSITE_TIERS.map((tier) => (
        <PriceCard key={tier.slug} tier={tier} featured={tier.slug === '15000'} />
      ))}
    </div>
  )
}
