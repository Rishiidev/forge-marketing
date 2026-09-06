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

/**
 * Renders a finding's plain-language WHAT WE FOUND / WHY IT MATTERS /
 * WHAT TO DO shape when a tool provides it (first used by
 * lib/website-analyzer/), with any raw technical evidence tucked behind a native
 * `<details>` disclosure — never dumped into the main text, never
 * requiring JavaScript to expand (keyboard- and screen-reader-friendly
 * for free). A finding with only `detail` set (e.g. lib/audit.ts's
 * simpler findings) still renders correctly — the richer fields are
 * additive, not required.
 */
export function ToolFinding({ toolSlug, finding }: { toolSlug: string; finding: ToolFindingType }) {
  const technicalEntries = finding.technicalDetails ? Object.entries(finding.technicalDetails) : []

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

      {finding.whyItMatters && (
        <Text size="body-sm" className="mb-2">
          <span className="font-semibold text-ink">Why it matters: </span>
          {finding.whyItMatters}
        </Text>
      )}

      {finding.recommendedAction && (
        <Text size="body-sm" className="mb-2 font-semibold text-ink-3">
          What to do: {finding.recommendedAction}
        </Text>
      )}

      {finding.recommendationHref && (
        <Link
          href={finding.recommendationHref}
          onClick={() => trackToolResultEngaged(toolSlug, finding.id)}
          className="focus-ring inline-block rounded-sm text-body-sm font-semibold text-ground underline underline-offset-2"
        >
          See how to fix this →
        </Link>
      )}

      {technicalEntries.length > 0 && (
        <details className="mt-4 rounded-md border border-border bg-paper p-3">
          <summary className="focus-ring cursor-pointer select-none text-body-sm font-semibold text-ink-3">Technical details</summary>
          <dl className="mt-3 grid gap-1.5">
            {technicalEntries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[minmax(0,auto)_1fr] gap-3 text-body-sm">
                <dt className="font-mono text-caption text-muted">{key}</dt>
                <dd className="text-ink-3">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  )
}
