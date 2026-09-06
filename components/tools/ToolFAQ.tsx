import type { ToolFaqItem } from '@/lib/tools/types'
import { FAQ } from '@/components/marketing/FAQ'
import { Heading } from '@/components/ui/Heading'

/** Thin wrapper around the site-wide FAQ/Accordion primitive. Renders nothing when a tool declares no FAQ — never a placeholder question. */
export function ToolFAQ({ items }: { items?: ToolFaqItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <div>
      <Heading as="h2" size="heading-sm" className="mb-4">
        Questions about this tool
      </Heading>
      <FAQ items={items} />
    </div>
  )
}
