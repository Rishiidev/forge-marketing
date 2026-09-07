import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion'

export interface FAQItem {
  question: string
  answer: string
}

/**
 * FAQ list — composes the shadcn/Radix Accordion primitive.
 * First item opens by default (`defaultValue="faq-0"`).
 */
export function FAQ({ items }: { items: FAQItem[] }) {
  return (
    <Accordion type="single" collapsible defaultValue={items[0] ? `faq-0` : undefined} className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={`faq-${i}`} value={`faq-${i}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}