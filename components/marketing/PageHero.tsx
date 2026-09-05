import type { ReactNode } from 'react'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

interface PageHeroProps {
  eyebrow?: string
  title: ReactNode
  description?: string
  children?: ReactNode
}

/** Generic hero block reused across every non-homepage marketing page. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <Section spacing="tight" className="pb-6">
      <div className="max-w-2xl">
        {eyebrow && (
          <Text as="span" size="caption" tone="ink" className="mb-4 block text-ground">
            {eyebrow}
          </Text>
        )}
        <Heading as="h1" size="heading-xl">
          {title}
        </Heading>
        {description && (
          <Text size="body-lg" className="mt-5">
            {description}
          </Text>
        )}
        {children}
      </div>
    </Section>
  )
}
