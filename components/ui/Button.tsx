import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'onDark'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-ground text-mark hover:bg-ground-2',
  secondary: 'bg-transparent text-ink border border-ink/10 hover:bg-paper-2',
  onDark: 'bg-mark text-ground hover:bg-mark-2',
}

const sizes: Record<Size, string> = {
  md: 'min-h-[50px] px-6 text-[15px]',
  lg: 'min-h-[58px] px-7 text-base',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

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
