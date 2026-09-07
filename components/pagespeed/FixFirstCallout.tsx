import type { Finding } from '@/lib/website-analyzer/types'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

/**
 * The "What should I fix first?" step (task brief §8) — one clear,
 * highest-priority recommendation, deterministically picked, not a
 * fabricated ranking. Priority order, fixed and disclosed here (the
 * same "no hidden weighting" discipline lib/audit.ts's PRIORITY_ORDER
 * already established):
 *
 * 1. A PageSpeed opportunity with the largest estimated savings — a
 *    concrete, Google-measured number to point at.
 * 2. Any other `critical`-severity finding (PageSpeed or technical).
 * 3. Any `warning`-severity finding.
 * 4. Nothing — an honest "you're in good shape," never an invented gap.
 */
function pickTopFinding(pagespeedFindings: Finding[], technicalFindings: Finding[]): Finding | null {
  const opportunities = pagespeedFindings
    .filter((f) => f.id.startsWith('pagespeed-opportunity-') && typeof f.evidence.estimatedSavingsMs === 'number')
    .sort((a, b) => (Number(b.evidence.estimatedSavingsMs) || 0) - (Number(a.evidence.estimatedSavingsMs) || 0))
  if (opportunities[0]) return opportunities[0]

  const all = [...pagespeedFindings, ...technicalFindings]
  const critical = all.find((f) => f.severity === 'critical')
  if (critical) return critical

  const warning = all.find((f) => f.severity === 'warning')
  if (warning) return warning

  return null
}

export function FixFirstCallout({ pagespeedFindings, technicalFindings }: { pagespeedFindings: Finding[]; technicalFindings: Finding[] }) {
  const top = pickTopFinding(pagespeedFindings, technicalFindings)

  return (
    <Card elevation="raised">
      <Text as="span" size="caption" className="mb-3 block">
        What should you fix first?
      </Text>
      {top ? (
        <>
          <Heading as="h3" size="heading-sm" className="mb-3">
            {top.title}
          </Heading>
          <Text size="body" className="mb-2">
            {top.whatWeFound}
          </Text>
          <Text size="body-sm" className="font-semibold text-ink-3">
            {top.recommendedAction}
          </Text>
        </>
      ) : (
        <Text size="body">Nothing urgent stood out this run — you&rsquo;re in good shape. Review the sections above for smaller, optional improvements.</Text>
      )}
    </Card>
  )
}
