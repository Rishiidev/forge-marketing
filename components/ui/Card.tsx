import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  as?: ElementType
  children: ReactNode
  className?: string
  /** 'flat' (default) sits on a paper background; 'raised' adds a soft shadow, for cards on a busier background. */
  elevation?: 'flat' | 'raised'
  [key: `data-${string}`]: string | boolean | undefined
}

export function Card({ as: Tag = 'div', children, className, elevation = 'flat', ...rest }: CardProps) {
  return (
    <Tag
      className={cn('rounded-2xl border border-border bg-white p-7', elevation === 'raised' && 'shadow-md', className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
