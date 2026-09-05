import type { ReactNode } from 'react'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

interface CTAProps {
  eyebrow?: string
  title: ReactNode
  description?: string
  children: ReactNode
}

/** Generic dark-ground call-to-action band — used at the end of a page to ask for the one next action. */
export function CTA({ eyebrow, title, description, children }: CTAProps) {
  return (
    <Section className="bg-ground text-mark">
      <div className="mx-auto max-w-content text-center">
        {eyebrow && (
          <Text as="span" size="caption" tone="onDark" className="mb-4 block">
            {eyebrow}
          </Text>
        )}
        <Heading as="h2" size="heading-lg" className="text-mark">
          {title}
        </Heading>
        {description && (
          <Text size="body-lg" tone="onDarkMuted" className="mx-auto mt-5 max-w-content">
            {description}
          </Text>
        )}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </Section>
  )
}
