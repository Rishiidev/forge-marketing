import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HeadingSize = 'display' | 'heading-xl' | 'heading-lg' | 'heading-md' | 'heading-sm'

const sizeClass: Record<HeadingSize, string> = {
  display: 'text-display',
  'heading-xl': 'text-heading-xl',
  'heading-lg': 'text-heading-lg',
  'heading-md': 'text-heading-md',
  'heading-sm': 'text-heading-sm',
}

interface HeadingProps {
  as?: ElementType
  size: HeadingSize
  children: ReactNode
  className?: string
}

/**
 * The only place a heading font size is chosen. `size` picks the visual
 * scale (see tailwind.config.ts fontSize); `as` picks the semantic tag —
 * these are independent so page structure (h1 → h2 → h3) never has to
 * bend to match a visual size, and vice versa.
 */
export function Heading({ as: Tag = 'h2', size, children, className }: HeadingProps) {
  return <Tag className={cn('text-ink', sizeClass[size], className)}>{children}</Tag>
}
