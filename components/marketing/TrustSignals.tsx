import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

export interface TrustSignal {
  title: string
  description: string
}

/**
 * A row of real, verifiable policy facts — not testimonials. Used
 * alongside real showcase/review proof where the number of actual
 * customer testimonials is too small to fill a section on its own
 * (docs/forge-business-rules.md §15: no fabricated testimonials, ever).
 */
export function TrustSignals({ items }: { items: TrustSignal[] }) {
  return (
    <div className="grid gap-0 overflow-hidden rounded-2xl border border-border bg-white sm:grid-cols-3">
      {items.map((item, i) => (
        <div key={item.title} className={i > 0 ? 'border-t border-border p-7 sm:border-l sm:border-t-0' : 'p-7'}>
          <Heading as="h3" size="heading-sm">
            {item.title}
          </Heading>
          <Text size="body-sm" className="mt-2">
            {item.description}
          </Text>
        </div>
      ))}
    </div>
  )
}
