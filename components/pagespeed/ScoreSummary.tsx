import type { PageSpeedAnalysis, PageSpeedCategoryScore } from '@/lib/pagespeed/provider'
import { RATING_LABEL } from '@/lib/pagespeed/thresholds'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

const CARDS: { key: 'performance' | 'accessibility' | 'bestPractices'; label: string }[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best practices' },
]

const BADGE_TONE = { good: 'success', 'needs-improvement': 'warning', poor: 'warning' } as const

function ScoreCard({ label, score }: { label: string; score: PageSpeedCategoryScore | undefined }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 text-center">
      <Text as="span" size="caption" className="mb-3 block">
        {label}
      </Text>
      {score ? (
        <>
          <Heading as="p" size="heading-xl" className="mb-2">
            {score.score}
          </Heading>
          <Badge tone={BADGE_TONE[score.rating]}>{RATING_LABEL[score.rating]}</Badge>
        </>
      ) : (
        <Text size="body-sm">Not available this run.</Text>
      )}
    </div>
  )
}

/** The "Performance summary" step (docs task brief §4) — three Lighthouse category scores, each interpreted with Good/Needs attention/Priority, never a bare number. */
export function ScoreSummary({ pagespeed }: { pagespeed: PageSpeedAnalysis }) {
  if (pagespeed.status === 'unavailable') {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Text size="body-sm">Live scores from Google weren&rsquo;t available for this run — see the SEO &amp; technical findings below instead.</Text>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CARDS.map((card) => (
        <ScoreCard key={card.key} label={card.label} score={pagespeed.lab.categories[card.key]} />
      ))}
    </div>
  )
}
