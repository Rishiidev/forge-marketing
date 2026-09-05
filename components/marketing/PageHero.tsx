import type { ReactNode } from 'react'
import { Section } from '@/components/ui/Section'

interface PageHeroProps {
  eyebrow?: string
  title: ReactNode
  description?: string
  children?: ReactNode
}

/** Generic hero block reused across every non-homepage marketing page. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <Section className="pb-10 pt-16">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-ground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h1>
        {description && <p className="mt-5 text-lg leading-relaxed text-muted">{description}</p>}
        {children}
      </div>
    </Section>
  )
}
