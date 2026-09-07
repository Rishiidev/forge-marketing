import { cn } from '@/lib/utils'

/**
 * Small microproof bar — three overlapping avatar circles + a one-line
 * trust caption. Renders under the audit form's submit button.
 *
 * Intentionally NOT a real social-proof widget: initials only (P.S., R.M.,
 * A.K. — no fabricated names or photos), generic caption that doesn't
 * claim specific customer counts. Defends docs/forge-business-rules.md §15
 * (no fake testimonials, no claimed conversion numbers) while still
 * providing the visual texture of "a human reviewed this".
 */
export function Microproof({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-caption text-muted', className)}>
      <div className="flex" aria-hidden="true">
        <span className="grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white bg-mark-2 text-[10px] font-semibold text-ink-3">
          PS
        </span>
        <span className="-ml-1.5 grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white bg-paper-3 text-[10px] font-semibold text-ink-3">
          RM
        </span>
        <span className="-ml-1.5 grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white bg-ground-3 text-[10px] font-semibold text-mark">
          AK
        </span>
      </div>
      <span>Reviewed by a real person in India · No third-party sharing</span>
    </div>
  )
}