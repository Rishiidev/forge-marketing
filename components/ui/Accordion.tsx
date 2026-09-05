'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AccordionItemData {
  id: string
  trigger: ReactNode
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItemData[]
  /** Allow more than one item open at once. Default: single-open (matches legacy FAQ behavior). */
  allowMultiple?: boolean
  defaultOpenId?: string
  className?: string
}

/**
 * Generic expand/collapse primitive. `components/marketing/FAQ.tsx` is the
 * only current consumer, but this makes no assumption about content being
 * a question/answer pair — reuse it anywhere a disclosure pattern fits.
 *
 * Motion: a grid-rows 0fr→1fr transition, not a JS height measurement —
 * smooth, no layout thrash, and reduced-motion-safe via the global
 * `prefers-reduced-motion` rule in globals.css.
 */
export function Accordion({ items, allowMultiple = false, defaultOpenId, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenId ? [defaultOpenId] : []))

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = allowMultiple ? new Set(prev) : new Set<string>()
      if (prev.has(id)) {
        if (allowMultiple) next.delete(id)
        // single-open: clicking the open item closes it (next stays empty)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={cn('border-t border-border', className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id)
        return (
          <div key={item.id} className="border-b border-border">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              className="focus-ring flex w-full items-center justify-between gap-6 rounded-sm py-5 text-left"
            >
              <span className="text-body-lg font-semibold text-ink">{item.trigger}</span>
              <span
                aria-hidden
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border text-lg transition-transform duration-200 ease-forge',
                  isOpen && 'rotate-45 border-ground bg-ground text-mark'
                )}
              >
                +
              </span>
            </button>
            <div
              id={`accordion-panel-${item.id}`}
              className="grid transition-[grid-template-rows] duration-300 ease-forge"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="pb-5 text-body text-muted">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
