import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'warning'

const tones: Record<Tone, string> = {
  neutral: 'bg-paper-2 text-ink-3',
  success: 'bg-success/10 text-success',
  warning: 'bg-warm/10 text-warm',
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold uppercase tracking-wide',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
