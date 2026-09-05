import { Text } from '@/components/ui/Text'

interface Feature {
  title: string
  description: string
}

export function FeatureList({ items }: { items: Feature[] }) {
  return (
    <ul className="grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title}>
          <strong className="block text-body font-semibold text-ink">{item.title}</strong>
          <Text size="body-sm">{item.description}</Text>
        </li>
      ))}
    </ul>
  )
}
