import type { Heading } from '@/lib/blog'
import { Text } from '@/components/ui/Text'

/**
 * Anchor-link nav built from `lib/blog.ts` `extractHeadings()`. Pure
 * server-rendered links — no scroll-spy JS, per "avoid unnecessary
 * client-side JavaScript" (the same call made for FAQ/Accordion staying
 * the only interactive pattern that needs it).
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null

  return (
    <nav aria-label="Table of contents" className="rounded-2xl border border-border bg-paper-2 p-6">
      <Text as="span" size="caption" className="mb-3 block">
        On this page
      </Text>
      <ul className="grid gap-2 text-body-sm">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? 'pl-4' : undefined}>
            <a href={`#${heading.id}`} className="focus-ring rounded-sm text-ink-3 hover:text-ink hover:underline">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
