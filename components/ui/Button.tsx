import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'onDark' | 'onDarkSecondary'
type Size = 'md' | 'lg'

const base =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,transform,box-shadow] duration-200 ease-forge disabled:pointer-events-none disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'bg-ground text-mark shadow-sm hover:bg-ground-2 hover:shadow-md active:scale-[0.98]',
  secondary: 'border border-border bg-transparent text-ink hover:border-border-strong hover:bg-paper-2 active:scale-[0.98]',
  onDark: 'bg-mark text-ground shadow-sm hover:bg-mark-2 hover:shadow-md active:scale-[0.98]',
  onDarkSecondary: 'border border-mark/30 bg-transparent text-mark hover:bg-mark/10 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  md: 'min-h-[48px] px-6 text-body-sm',
  lg: 'min-h-[56px] px-7 text-body',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

/**
 * Every clickable call-to-action in the app — form submit or navigation —
 * goes through this component. Four variants only, deliberately: primary
 * (the one action per view that matters), secondary (everything else),
 * and the onDark pair for use on ground-colored surfaces. Adding a fifth
 * variant should be rare and should mean a genuinely new semantic case,
 * not a one-off visual tweak.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, ...rest } = props
  const classes = cn(base, variants[variant], sizes[size], className)

  if ('href' in rest && rest.href !== undefined) {
    const { href, children, ...anchorProps } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    )
  }

  const { children, ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
