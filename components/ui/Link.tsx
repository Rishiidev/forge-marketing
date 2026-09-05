import NextLink from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type LinkVariant = 'default' | 'quiet'

const variants: Record<LinkVariant, string> = {
  // Underlined on hover only — for links inside body copy.
  default: 'text-ink underline-offset-4 hover:underline hover:text-ground',
  // No underline treatment at all — for nav/footer links.
  quiet: 'text-muted transition-colors hover:text-ink',
}

interface LinkProps extends ComponentProps<typeof NextLink> {
  variant?: LinkVariant
}

/**
 * Distinct from Button: Link is for navigation and inline references,
 * never for a primary call-to-action (use Button for that, even when it
 * points at another page rather than submitting a form).
 */
export function Link({ variant = 'default', className, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn('focus-ring rounded-sm', variants[variant], className)}
      {...props}
    />
  )
}
