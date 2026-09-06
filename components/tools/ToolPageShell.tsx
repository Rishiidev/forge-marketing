'use client'

import { useEffect, useRef, useState } from 'react'
import type { ToolDefinition, ToolError as ToolErrorType, ToolExecutionState, ToolInput as ToolInputShape, ToolResult as ToolResultType } from '@/lib/tools/types'
import { executeTool, nextState, validateForTool } from '@/lib/tools/execution'
import {
  captureAttribution,
  trackToolCompleted,
  trackToolFailed,
  trackToolPartial,
  trackToolProcessingStarted,
  trackToolStarted,
  trackToolValidationFailed,
  trackToolViewed,
} from '@/lib/tools/analytics'
import { getRelatedTools } from '@/lib/tools/registry'
import { Section } from '@/components/ui/Section'
import { ToolHeader } from './ToolHeader'
import { ToolInput } from './ToolInput'
import { ToolProgress } from './ToolProgress'
import { ToolResult } from './ToolResult'
import { ToolError } from './ToolError'
import { ToolStatus } from './ToolStatus'
import { ToolMethodology } from './ToolMethodology'
import { ToolFAQ } from './ToolFAQ'
import { RelatedTools } from './RelatedTools'

/**
 * The one orchestrator every tool page mounts — this is what turns a
 * `ToolDefinition` into a complete, working page: consistent header,
 * validated input, an honest processing state, a result (or a partial
 * one) built from the tool's own `run()`, error handling, analytics at
 * every transition, and the methodology/FAQ/related-tools sections
 * every tool gets for free. See docs/tool-architecture.md.
 *
 * Drives its state exclusively through lib/tools/execution.ts's
 * nextState() — never a raw setState to an arbitrary
 * ToolExecutionState — so an invalid transition can't slip in through a
 * future edit here.
 */
export function ToolPageShell({ tool }: { tool: ToolDefinition }) {
  const [state, setState] = useState<ToolExecutionState>('idle')
  const [result, setResult] = useState<ToolResultType | null>(null)
  const [error, setError] = useState<ToolErrorType | null>(null)
  const [lastInput, setLastInput] = useState<ToolInputShape | null>(null)
  const viewedRef = useRef(false)

  useEffect(() => {
    if (viewedRef.current) return
    viewedRef.current = true
    trackToolViewed(tool.slug)
  }, [tool.slug])

  async function run(input: ToolInputShape) {
    setState((s) => nextState(s, 'validating'))
    const validation = validateForTool(tool, input)

    if (!validation.ok) {
      trackToolValidationFailed(tool.slug, validation.errors.length)
      setError({ code: 'VALIDATION_FAILED', message: validation.errors[0]?.message ?? 'Check your answers and try again.', retryable: false })
      setState((s) => nextState(s, 'error'))
      return
    }

    const cleanInput = validation.value ?? {}
    setLastInput(cleanInput)
    trackToolStarted(tool.slug)
    setState((s) => nextState(s, 'processing'))
    trackToolProcessingStarted(tool.slug)

    const outcome = await executeTool(tool, cleanInput, { attribution: captureAttribution() })

    if (outcome.state === 'error') {
      setError(outcome.error)
      trackToolFailed(tool.slug, outcome.error.code)
      setState((s) => nextState(s, 'error'))
      return
    }

    setResult(outcome.result)
    setState((s) => nextState(s, outcome.state))
    if (outcome.state === 'success') {
      trackToolCompleted(tool.slug, outcome.result.findings.length, outcome.result.cached)
    } else {
      trackToolPartial(tool.slug, outcome.result.findings.filter((f) => f.resultCategory === 'failed').length)
    }
  }

  function retry() {
    setError(null)
    setState((s) => nextState(s, 'idle'))
    if (lastInput) run(lastInput)
  }

  const related = getRelatedTools(tool)
  const showingResult = state === 'success' || state === 'partial'

  return (
    <>
      <ToolHeader tool={tool} />
      <ToolStatus state={state} />

      <Section spacing="tight">
        {(state === 'idle' || state === 'validating') && <ToolInput fields={tool.inputFields} onSubmit={run} />}
        {state === 'processing' && <ToolProgress />}
        {state === 'error' && error && <ToolError error={error} onRetry={error.retryable ? retry : undefined} />}
        {showingResult && result && <ToolResult tool={tool} result={result} />}
      </Section>

      <Section spacing="tight" className="grid gap-10 pt-0 lg:grid-cols-2">
        <ToolMethodology methodology={tool.methodology} dataSources={tool.dataSources} />
        <ToolFAQ items={tool.faq} />
      </Section>

      <RelatedTools tools={related} />
    </>
  )
}
