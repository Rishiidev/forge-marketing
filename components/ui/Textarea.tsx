import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'focus-ring min-h-[120px] w-full resize-y rounded-md border border-border bg-paper px-4 py-3 text-body text-ink placeholder:text-muted-2 transition-colors',
        'focus-visible:border-ground focus-visible:bg-white',
        className
      )}
      {...props}
    />
  )
}
