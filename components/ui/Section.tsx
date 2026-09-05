import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './Container'

interface SectionProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  id?: string
  /** 'default' = generous section rhythm. 'tight' = for sections stacked closely (e.g. right after a hero). */
  spacing?: 'default' | 'tight'
}

const spacingClass = {
  default: 'py-[clamp(5rem,11vw,8.75rem)]',
  tight: 'py-[clamp(3.5rem,8vw,6rem)]',
}

export function Section({ children, className, containerClassName, id, spacing = 'default' }: SectionProps) {
  return (
    <section id={id} className={cn(spacingClass[spacing], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
