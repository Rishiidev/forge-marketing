import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TextSize = 'body-lg' | 'body' | 'body-sm' | 'caption'
type TextTone = 'ink' | 'muted' | 'onDark' | 'onDarkMuted'

const sizeClass: Record<TextSize, string> = {
  'body-lg': 'text-body-lg',
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption uppercase tracking-wide font-semibold',
}

const toneClass: Record<TextTone, string> = {
  ink: 'text-ink',
  muted: 'text-muted',
  onDark: 'text-mark',
  onDarkMuted: 'text-mark/70',
}

interface TextProps {
  as?: ElementType
  size?: TextSize
  tone?: TextTone
  children: ReactNode
  className?: string
}

/** The only place a body font size/tone is chosen outside a heading. */
export function Text({ as: Tag = 'p', size = 'body', tone = 'muted', children, className }: TextProps) {
  return <Tag className={cn(sizeClass[size], toneClass[tone], className)}>{children}</Tag>
}
