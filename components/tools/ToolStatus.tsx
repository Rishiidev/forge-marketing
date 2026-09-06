import type { ToolExecutionState } from '@/lib/tools/types'

const STATE_LABEL: Partial<Record<ToolExecutionState, string>> = {
  validating: 'Checking your answers…',
  processing: 'Running the check…',
  success: 'Done — your result is ready.',
  partial: 'Done, but one part could not be checked.',
  error: 'Something went wrong.',
}

/**
 * A screen-reader-only, `aria-live` announcement of the current
 * execution-state transition — satisfies docs/tool-architecture.md's
 * accessibility requirement for error/status announcements without
 * adding a second, visible status line next to ToolProgress/ToolError
 * (which already say the same thing visually). Renders nothing for
 * 'idle' — there's nothing to announce before a visitor has done
 * anything.
 */
export function ToolStatus({ state }: { state: ToolExecutionState }) {
  const label = STATE_LABEL[state]
  if (!label) return null
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {label}
    </p>
  )
}
