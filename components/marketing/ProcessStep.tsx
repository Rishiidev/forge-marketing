import type { ReactNode } from 'react'
import { Text } from '@/components/ui/Text'

interface ProcessStepProps {
  index: number
  title: string
  description: string
  meta?: ReactNode
}

/** One numbered step. Compose a list of these for a "how it works" sequence — see legacy/5000-setup.html's 4-step flow. */
export function ProcessStep({ index, title, description, meta }: ProcessStepProps) {
  return (
    <div className="border-t border-border pt-5">
      <span className="font-mono text-caption text-ground">{String(index).padStart(2, '0')}</span>
      <strong className="mt-3 block text-body-lg font-semibold text-ink">{title}</strong>
      <Text size="body-sm" className="mt-1.5">
        {description}
      </Text>
      {meta && (
        <Text as="span" size="caption" className="mt-3 inline-block font-semibold text-success">
          {meta}
        </Text>
      )}
    </div>
  )
}

export function ProcessSteps({ steps }: { steps: ProcessStepProps[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <ProcessStep key={step.index} {...step} />
      ))}
    </div>
  )
}
