interface Feature {
  title: string
  description: string
}

export function FeatureList({ items }: { items: Feature[] }) {
  return (
    <ul className="grid gap-6 border-t border-ink/10 pt-8 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title}>
          <strong className="block text-[15px] font-semibold text-ink">{item.title}</strong>
          <span className="text-sm text-muted">{item.description}</span>
        </li>
      ))}
    </ul>
  )
}
