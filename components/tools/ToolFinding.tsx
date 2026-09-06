'use client'

import Link from 'next/link'
import type { ToolFinding as ToolFindingType, ToolFindingSeverity, ToolResultCategory } from '@/lib/tools/types'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { trackToolResultEngaged } from '@/lib/tools/analytics'

const SEVERITY_LABEL: Record<ToolFindingSeverity, string> = { info: 'Info', good: 'Good', warning: 'Needs work', critical: 'Critical' }
const SEVERITY_TONE: Record<ToolFindingSeverity, 'neutral' | 'success' | 'warning'> = {
  info: 'neutral',
  good: 'success',
  warning: 'warning',
  critical: 'warning',
}

/**
 * CRITICAL, per docs/tool-architecture.md: this label is its own,
 * always-visible badge, never merged into the severity badge above —
 * an 'inferred' finding must never visually read the same as a
 * 'verified' one. 'verified' is the only category that gets the
 * success/green tone; every other category (including 'failed', which
 * already has a warning-toned severity badge) stays neutral here so
 * there's exactly one green badge in the whole finding, and it only
 * ever means "the tool actually confirmed this."
 */
const RESULT_CATEGORY_LABEL: Record<ToolResultCategory, string> = {
  verified: 'Verified',
  inferred: 'Estimated',
  unavailable: 'Not available',
  not_checked: 'Not checked',
  failed: 'Check failed',
}

export function ToolFinding({ toolSlug, finding }: { toolSlug: string; finding: ToolFindingType }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Heading as="h3" size="heading-sm" className="!text-body-lg">
          {finding.label}
        </Heading>
        <Badge tone={SEVERITY_TONE[finding.severity]}>{SEVERITY_LABEL[finding.severity]}</Badge>
        <Badge tone={finding.resultCategory === 'verified' ? 'success' : 'neutral'}>{RESULT_CATEGORY_LABEL[finding.resultCategory]}</Badge>
      </div>
      <Text size="body" className="mb-2 text-ink-3">
        {finding.detail}
      </Text>
      {finding.recommendationHref && (
        <Link
          href={finding.recommendationHref}
          onClick={() => trackToolResultEngaged(toolSlug, finding.id)}
          className="focus-ring inline-block rounded-sm text-body-sm font-semibold text-ground underline underline-offset-2"
        >
          See how to fix this →
        </Link>
      )}
    </div>
  )
}
