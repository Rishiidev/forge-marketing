import { Accordion, type AccordionItemData } from '@/components/ui/Accordion'

export interface FAQItem {
  question: string
  answer: string
}

/** Thin wrapper mapping {question, answer} pairs onto the generic Accordion primitive. */
export function FAQ({ items }: { items: FAQItem[] }) {
  const accordionItems: AccordionItemData[] = items.map((item, i) => ({
    id: `faq-${i}`,
    trigger: item.question,
    content: item.answer,
  }))

  return <Accordion items={accordionItems} />
}
