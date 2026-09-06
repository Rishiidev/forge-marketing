'use client'

import { useEffect, useRef } from 'react'
import type { AuditResult } from '@/lib/audit'
import { trackEvent } from '@/lib/analytics'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { AuditLeadCaptureForm } from './AuditLeadCaptureForm'

const SIGNAL_LABEL = { strong: 'Strong', weak: 'Needs work', missing: 'Missing' } as const
const SIGNAL_TONE = { strong: 'success', weak: 'warning', missing: 'warning' } as const

export function AuditResultView({
  result,
  industry,
  location,
}: {
  result: AuditResult
  industry?: string
  location?: string
}) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    trackEvent({
      name: 'audit_completed',
      props: {
        topCategory: result.recommendation.categoryId ?? 'none',
        strongCount: result.counts.strong,
        weakCount: result.counts.weak,
        missingCount: result.counts.missing,
      },
    })
    trackEvent({ name: 'audit_result_viewed', props: { topCategory: result.recommendation.categoryId ?? 'none' } })
    // Fire once, exactly when this view actually mounts (i.e. is rendered
    // to the visitor) — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-12">
      <div>
        <Text as="span" size="caption" className="mb-3 block">
          Your audit result
        </Text>
        <Heading as="h2" size="heading-lg" className="mb-4">
          {result.businessName}
        </Heading>
        <Text size="body-lg">
          {result.counts.strong} of 9 areas are strong, {result.counts.weak} need work, and {result.counts.missing} are missing.
        </Text>
      </div>

      <div className="grid gap-5">
        {result.categories.map((category) => (
          <div key={category.id} className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Heading as="h3" size="heading-sm" className="!text-body-lg">
                {category.label}
              </Heading>
              <Badge tone={SIGNAL_TONE[category.signal]}>{SIGNAL_LABEL[category.signal]}</Badge>
            </div>
            <Text size="body" className="mb-2 text-ink-3">
              {category.statement}
            </Text>
            <Text size="body-sm" className="mb-2">
              Why it matters: {category.whyItMatters}
            </Text>
            {category.whatToDoNext && (
              <Text size="body-sm" className="font-semibold text-ink-3">
                What to do next: {category.whatToDoNext}
              </Text>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-ground p-8 text-mark sm:p-10">
        <Text as="span" size="caption" tone="onDark" className="mb-3 block">
          Recommendation
        </Text>
        <Heading as="h3" size="heading-md" className="mb-4 text-mark">
          {result.recommendation.headline}
        </Heading>
        <Text size="body-lg" tone="onDarkMuted" className="mb-7">
          {result.recommendation.description}
        </Text>
        <Button
          href={result.recommendation.ctaHref}
          variant="onDark"
          size="lg"
          onClick={() => trackEvent({ name: 'audit_cta_clicked', props: { destination: result.recommendation.ctaHref } })}
        >
          {result.recommendation.ctaLabel}
        </Button>
      </div>

      <AuditLeadCaptureForm result={result} industry={industry} location={location} />
    </div>
  )
}
