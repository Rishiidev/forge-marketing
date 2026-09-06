/**
 * The 'processing' execution state. Honest by default — the spinner and
 * message describe what's actually happening (validated input being
 * run through the tool's own logic), never implying a live scan that
 * isn't occurring. A tool whose `run()` genuinely takes real,
 * observable steps (e.g. fetch → parse → score) can pass `steps` to
 * show progress through them; without it, this renders the same
 * single-message spinner components/audit/AuditProcessing.tsx already
 * established.
 */
export function ToolProgress({ message = 'Running the check…', steps, currentStepIndex = 0 }: { message?: string; steps?: string[]; currentStepIndex?: number }) {
  const label = steps && steps.length > 0 ? (steps[currentStepIndex] ?? message) : message

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-white p-16 text-center">
      <span aria-hidden className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-ground" />
      <p className="text-body-lg font-semibold text-ink">{label}</p>
      {steps && steps.length > 1 && (
        <p className="text-body-sm text-muted">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      )}
    </div>
  )
}
