'use client'

import * as React from 'react'
import Link from 'next/link'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Forge Button — shadcn API surface, Forge tokens.
 *
 * Extends the existing Button with three shadcn-style additions:
 *  - `asChild` so a Button can render as a child (e.g. Next Link) without
 *    nesting <a> inside <button>
 *  - `icon` / `icon-sm` for icon-only buttons (matches shadcn's square API)
 *  - The four Forge variants preserved + `ghost` + `link` utilities.
 *
 * Backwards-compat: still accepts the old `href` prop (renders Next/Link),
 * which the rest of the codebase uses today. New code should prefer
 *   <Button asChild><Link href="/x">…</Link></Button>
 * — the old API will be removed once every caller is migrated.
 */

const buttonVariants = cva(
  'focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,transform,box-shadow,border-color] duration-200 ease-forge disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-ground text-mark shadow-sm hover:bg-ground-2 hover:shadow-md active:scale-[0.98]',
        secondary: 'border border-border bg-transparent text-ink hover:border-border-strong hover:bg-paper-2 active:scale-[0.98]',
        onDark: 'bg-mark text-ground shadow-sm hover:bg-mark-2 hover:shadow-md active:scale-[0.98]',
        onDarkSecondary: 'border border-mark/30 bg-transparent text-mark hover:bg-mark/10 active:scale-[0.98]',
        ghost: 'bg-transparent text-ink hover:bg-paper-2 active:scale-[0.98]',
        link: 'text-ink underline-offset-4 hover:underline p-0 h-auto min-h-0',
      },
      size: {
        md: 'min-h-[48px] px-6 text-body-sm',
        lg: 'min-h-[56px] px-7 text-body',
        sm: 'min-h-[40px] px-4 text-body-sm',
        icon: 'h-10 w-10 min-h-0 p-0',
        'icon-sm': 'h-8 w-8 min-h-0 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Legacy: render as a Next/Link with this href. Prefer `asChild` + Link. */
  href?: string
  /** Anchor-only: forwarded to the underlying <a> when href is set. */
  target?: string
  rel?: string
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, href, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    if (href !== undefined) {
      return (
        <Link href={href} className={classes} {...(props as Record<string, unknown>)}>
          {children}
        </Link>
      )
    }

    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={classes} ref={ref} {...props}>
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }