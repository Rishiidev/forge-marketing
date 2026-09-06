import Link from 'next/link'
import type { BreadcrumbItem } from '@/lib/seo'

/**
 * Visible breadcrumb trail. Pair with `lib/seo.ts` `buildBreadcrumbJsonLd()`
 * — pass it the same `items` so the structured data and the on-page trail
 * never disagree. The last item is the current page: rendered as plain
 * text, not a link.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-caption uppercase tracking-wide text-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="font-semibold text-ink">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="focus-ring rounded-sm font-semibold hover:text-ink">
                  {item.name}
                </Link>
              )}
              {!isLast && (
                <span aria-hidden className="text-muted">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
