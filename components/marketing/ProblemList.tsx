import { Text } from '@/components/ui/Text'

interface Problem {
  title: string
  description: string
}

/**
 * Numbered list of honest, non-shaming pain points — Section 5 of the homepage.
 * Extracted from app/page.tsx for reuse and to keep the page file lean.
 * Mirrors the visual rhythm of FeatureList (border-top dividers, mono
 * 01–04 prefix in JetBrains Mono) — same pattern the 7-point audit list
 * and ProcessSteps both use.
 */
export function ProblemList({ items }: { items: Problem[] }) {
  return (
    <div className="grid gap-0 border-t border-border">
      {items.map((item, i) => (
        <div
          key={item.title}
          className="grid grid-cols-[auto_1fr] items-start gap-5 border-b border-border py-6"
        >
          <span className="font-mono text-caption text-muted">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <strong className="block text-body-lg font-semibold text-ink">
              {item.title}
            </strong>
            <Text size="body-sm" className="mt-1">
              {item.description}
            </Text>
          </div>
        </div>
      ))}
    </div>
  )
}