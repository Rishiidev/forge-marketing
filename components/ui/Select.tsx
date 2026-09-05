import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Custom chevron via background-image (no extra icon dependency), same
 * pattern legacy/*.html used — matched here so selects don't look like an
 * unstyled browser default next to Input/Textarea.
 */
const chevron =
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27 fill=%27%231B1B12%27%3E%3Cpath d=%27M6 8L2 4h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] pr-9"

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'focus-ring min-h-[48px] w-full appearance-none rounded-md border border-border bg-paper px-4 text-body text-ink transition-colors',
        'focus-visible:border-ground focus-visible:bg-white',
        chevron,
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
