'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { cn } from '@/lib/utils'

/**
 * Forge Accordion — Radix-wrapped, themed to the existing tokens.
 * Drop-in replacement for the legacy CSS-only Accordion (the FAQ
 * component already wraps this, so callers don't need to change).
 *
 * API matches shadcn's accordion: `Accordion`, `AccordionItem`,
 * `AccordionTrigger`, `AccordionContent`. Adds a small `defaultOpen`
 * helper for the FAQ first-item-opens behavior.
 */

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-t border-border last:border-b', className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex flex-1 items-center justify-between gap-4 py-5 text-body-lg font-medium text-ink transition-colors duration-200 ease-forge hover:text-ground [&[data-state=open]>svg]:rotate-45 [&[data-state=open]>svg]:bg-ground [&[data-state=open]>svg]:text-mark',
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-full bg-paper-2 text-ink text-[18px] font-medium transition-all duration-300 ease-forge group-data-[state=open]:rotate-45 group-data-[state=open]:bg-ground group-data-[state=open]:text-mark"
      >
        +
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-body text-ink-3 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    )}
    {...props}
  >
    <div className={cn('pb-6 pr-8 max-w-[65ch]', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }