import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Forge Input — themed to the existing tokens.
 * Same API as shadcn's Input (just `React.forwardRef<HTMLInputElement>`).
 * Adds `aria-invalid` styling for form error states, which is what
 * the AuditForm already uses.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full min-h-[48px] rounded-md border border-border-strong bg-paper px-3.5 py-3 text-body text-ink transition-[border-color,background-color,box-shadow] duration-200 ease-forge',
          'file:border-0 file:bg-transparent file:text-body-sm file:font-medium',
          'placeholder:text-muted-2',
          'hover:border-ink-3',
          'focus:border-ground focus:bg-white focus:shadow-[0_0_0_3px_rgba(58,59,31,0.08)] focus:outline-none',
          'aria-[invalid=true]:border-warm aria-[invalid=true]:shadow-[0_0_0_3px_rgba(184,90,46,0.10)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }