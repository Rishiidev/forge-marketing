import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Raw styled input — the design-system atom. `components/forms/TextField`
 * composes this with a label and error text for actual form use; reach
 * for Input directly only when you don't need a label (rare).
 */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'focus-ring min-h-[48px] w-full rounded-md border border-border bg-paper px-4 text-body text-ink placeholder:text-muted-2 transition-colors',
        'focus-visible:border-ground focus-visible:bg-white',
        className
      )}
      {...props}
    />
  )
}
