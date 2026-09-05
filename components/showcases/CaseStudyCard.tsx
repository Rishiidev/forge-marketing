import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

interface CaseStudyCardProps {
  href: string
  title: string
  category: string
  description: string
  metric?: { value: string; label: string }
}

/**
 * A richer, featured variant of ShowcaseCard — for a detailed case study
 * (category badge + a real, sourced metric) rather than a plain grid
 * tile. Same rule as Metric/Testimonial: the `metric` prop must be a real,
 * current number, never a placeholder used to make the card look fuller.
 */
export function CaseStudyCard({ href, title, category, description, metric }: CaseStudyCardProps) {
  return (
    <Link
      href={href}
      className="focus-ring grid gap-6 rounded-2xl border border-border bg-white p-8 transition-colors duration-200 ease-forge hover:border-border-strong md:grid-cols-[1fr_auto]"
    >
      <div>
        <Badge>{category}</Badge>
        <Heading as="h3" size="heading-md" className="mt-4">
          {title}
        </Heading>
        <Text size="body" className="mt-3">
          {description}
        </Text>
      </div>
      {metric && (
        <div className="flex flex-col justify-center border-t border-border pt-6 text-center md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <span className="text-heading-md text-ink">{metric.value}</span>
          <span className="mt-1 text-body-sm text-muted">{metric.label}</span>
        </div>
      )}
    </Link>
  )
}
