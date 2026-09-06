'use client'

/**
 * Brief loading state between submitting answers and showing the result.
 * The computation itself is instant (lib/audit.ts is pure, client-side) —
 * this pause is a perceived-progress courtesy, not a stand-in for a real
 * scan. Copy is deliberately honest about what's happening: "reviewing
 * your answers," never "scanning your website" or "fetching your
 * reviews" — no live fetch of either ever happens here.
 */
export function AuditProcessing() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-white p-16 text-center">
      <span
        aria-hidden
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-ground"
      />
      <p className="text-body-lg font-semibold text-ink">Reviewing your answers…</p>
      <p className="text-body-sm text-muted">Putting together what&rsquo;s good, what&rsquo;s missing, and what to fix first.</p>
    </div>
  )
}
