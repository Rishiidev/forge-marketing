'use client'

import { useEffect, useRef, useState } from 'react'
import type { ToolDefinition, ToolError as ToolErrorType, ToolExecutionState, ToolInput as ToolInputShape } from '@/lib/tools/types'
import { nextState } from '@/lib/tools/execution'
import { toToolError } from '@/lib/tools/errors'
import { validateToolInput } from '@/lib/tools/validation'
import { trackEvent } from '@/lib/analytics'
import { getRelatedTools } from '@/lib/tools/registry'
import { getPageSpeedAnalysis, type PageSpeedToolResult } from '@/lib/pagespeed/actions'
import { Section } from '@/components/ui/Section'
import { ToolHeader } from '@/components/tools/ToolHeader'
import { ToolInput } from '@/components/tools/ToolInput'
import { ToolProgress } from '@/components/tools/ToolProgress'
import { ToolError } from '@/components/tools/ToolError'
import { ToolStatus } from '@/components/tools/ToolStatus'
import { ToolFindingList } from '@/components/tools/ToolFindingList'
import { ToolCTA } from '@/components/tools/ToolCTA'
import { ToolMethodology } from '@/components/tools/ToolMethodology'
import { ToolFAQ } from '@/components/tools/ToolFAQ'
import { RelatedTools } from '@/components/tools/RelatedTools'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { toToolFinding } from '@/lib/website-analyzer/types'
import { ScoreSummary } from './ScoreSummary'
import { CoreWebVitalsPanel } from './CoreWebVitalsPanel'
import { OpportunitiesList } from './OpportunitiesList'
import { FixFirstCallout } from './FixFirstCallout'

/**
 * The bespoke Forge PageSpeed Test page — follows the same
 * idle/validating/processing/success|partial/error state machine every
 * other tool uses (lib/tools/execution.ts), and reuses every existing
 * engine component it can (ToolInput, ToolProgress, ToolError,
 * ToolStatus, ToolFindingList, ToolCTA, ToolMethodology, ToolFAQ,
 * RelatedTools) — only the PageSpeed-specific presentation (score
 * summary, Core Web Vitals grid, opportunities, "fix this first") is
 * new, because the brief's 9-step UX needs more structure than the
 * generic flat ToolResult gives it. The underlying data comes from
 * exactly one call (lib/pagespeed/actions.ts getPageSpeedAnalysis) —
 * this component does no analysis of its own.
 *
 * `state` becomes 'partial', not 'error', when Google's PageSpeed data
 * is unavailable but the internal engine's SEO/technical checks still
 * ran — "return a truthful partial state," never an all-or-nothing
 * failure over one missing data source. 'error' is reserved for a
 * genuine failure (rate limited, invalid URL, or the homepage itself
 * being unreachable — nothing left to show at all).
 */
export function PageSpeedTool({ tool }: { tool: ToolDefinition }) {
  const [state, setState] = useState<ToolExecutionState>('idle')
  const [result, setResult] = useState<PageSpeedToolResult | null>(null)
  const [error, setError] = useState<ToolErrorType | null>(null)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const viewedRef = useRef(false)

  useEffect(() => {
    if (viewedRef.current) return
    viewedRef.current = true
    trackEvent({ name: 'pagespeed_viewed', props: {} })
  }, [])

  async function run(input: ToolInputShape) {
    setState((s) => nextState(s, 'validating'))
    const validation = validateToolInput(tool.inputFields, input)
    if (!validation.ok) {
      setError({ code: 'VALIDATION_FAILED', message: validation.errors[0]?.message ?? 'Enter a valid website address.', retryable: false })
      setState((s) => nextState(s, 'error'))
      return
    }

    const url = String(validation.value?.url ?? '')
    setLastUrl(url)
    trackEvent({ name: 'pagespeed_started', props: {} })
    setState((s) => nextState(s, 'processing'))

    try {
      const analysis = await getPageSpeedAnalysis(url)
      setResult(analysis)
      const nextExecutionState = analysis.pagespeed.status === 'ok' ? 'success' : 'partial'
      setState((s) => nextState(s, nextExecutionState))
      trackEvent({
        name: 'pagespeed_completed',
        props: {
          dataAvailable: analysis.pagespeed.status === 'ok',
          performanceScore: analysis.pagespeed.status === 'ok' ? (analysis.pagespeed.lab.categories.performance?.score ?? null) : null,
        },
      })
    } catch (err) {
      const toolError = toToolError(err)
      setError(toolError)
      setState((s) => nextState(s, 'error'))
      trackEvent({ name: 'pagespeed_failed', props: { reason: toolError.code } })
    }
  }

  function retry() {
    setError(null)
    setState((s) => nextState(s, 'idle'))
    if (lastUrl) run({ url: lastUrl })
  }

  const related = getRelatedTools(tool)
  const showingResult = state === 'success' || state === 'partial'
  const technicalToolFindings = result ? result.technicalFindings.map(toToolFinding) : []

  return (
    <>
      <ToolHeader tool={tool} />
      <ToolStatus state={state} />

      <Section spacing="tight">
        {(state === 'idle' || state === 'validating') && <ToolInput fields={tool.inputFields} onSubmit={run} submitLabel="Run my PageSpeed test" />}
        {state === 'processing' && <ToolProgress message="Running a real PageSpeed test — this can take up to 20-25 seconds…" />}
        {state === 'error' && error && <ToolError error={error} onRetry={error.retryable ? retry : undefined} />}

        {showingResult && result && (
          <div className="grid gap-12">
            {result.pagespeed.status === 'unavailable' && (
              <div className="rounded-2xl border border-dashed border-border p-6">
                <Text size="body-sm">
                  Live PageSpeed data from Google wasn&rsquo;t available for this run — showing what Forge&rsquo;s own engine could still check below.
                </Text>
              </div>
            )}

            <div>
              <Text as="span" size="caption" className="mb-3 block">
                Performance summary
              </Text>
              <ScoreSummary pagespeed={result.pagespeed} />
            </div>

            <div>
              <Heading as="h2" size="heading-md" className="mb-5">
                Core Web Vitals
              </Heading>
              <CoreWebVitalsPanel pagespeedFindings={result.pagespeedFindings} />
            </div>

            <div>
              <Heading as="h2" size="heading-md" className="mb-5">
                Biggest opportunities
              </Heading>
              <OpportunitiesList pagespeedFindings={result.pagespeedFindings} />
            </div>

            <div>
              <Heading as="h2" size="heading-md" className="mb-5">
                SEO &amp; technical findings
              </Heading>
              <ToolFindingList toolSlug={tool.slug} findings={technicalToolFindings} />
            </div>

            <FixFirstCallout pagespeedFindings={result.pagespeedFindings} technicalFindings={result.technicalFindings} />

            <ToolCTA
              toolSlug={tool.slug}
              primary={tool.primaryCTA}
              secondary={tool.secondaryCTA}
              onCtaClick={(cta) => trackEvent({ name: 'pagespeed_cta_clicked', props: { location: cta.location, destination: cta.href } })}
            />
          </div>
        )}
      </Section>

      <Section spacing="tight" className="grid gap-10 pt-0 lg:grid-cols-2">
        <ToolMethodology methodology={tool.methodology} dataSources={tool.dataSources} />
        <ToolFAQ items={tool.faq} />
      </Section>

      <RelatedTools tools={related} />
    </>
  )
}
