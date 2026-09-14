import { Text } from '@/components/ui/Text'

export interface AuditPoint {
  title: string
  description: string
}

/**
 * Numbered list of the 7 points reviewed in the audit — Section 4 of the homepage.
 * Sits beside the AuditForm in a two-column layout so visitors see what
 * they're filling out for before they fill it.
 * Uses the same visual rhythm as FeatureList/ProblemList (border-top
 * dividers + JetBrains Mono 01–07 prefix).
 */
export function AuditPointList({ items }: { items: AuditPoint[] }) {
  return (
    <ul className="grid gap-5 border-t border-border pt-8 sm:grid-cols-2" role="list" aria-label="The 7 points reviewed in your audit">
      {items.map((item, i) => (
        <li
          key={item.title}
          className="grid grid-cols-[40px_1fr] items-start gap-4 border-t border-border pt-5"
        >
          <span className="font-mono text-caption text-ground">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <strong className="block text-body font-semibold text-ink">
              {item.title}
            </strong>
            <Text size="body-sm" className="mt-1">
              {item.description}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  )
}