import { CAPACITY } from '@/lib/constants'

/**
 * The legacy capacity-cap mechanism (legacy/index.html), reimplemented as
 * a plain, reusable component reading from a single config object
 * (lib/constants.ts CAPACITY) instead of an inline <script> constant.
 * That "one number drives the whole page" property is preserved: change
 * CAPACITY once, every usage of this component updates.
 */
export function CapacityStrip() {
  const isFull = CAPACITY.remaining <= 0
  const fillPct = Math.round(((CAPACITY.total - CAPACITY.remaining) / CAPACITY.total) * 100)

  return (
    <div
      className="max-w-md rounded-2xl border border-ink/10 bg-paper-2 p-5"
      data-state={isFull ? 'full' : 'open'}
      aria-live="polite"
    >
      <div className="mb-2 flex items-baseline justify-between text-[13px] text-muted">
        <strong className="text-ink">This month</strong>
        <span>{isFull ? 'Cap full' : 'Live capacity'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-3">
        <div
          className="h-full rounded-full bg-ground transition-[width]"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>
          <strong className="text-ink">
            {isFull ? 'Cap full' : `${CAPACITY.remaining} of ${CAPACITY.total} launch slots`}
          </strong>{' '}
          {isFull ? '— waitlist open' : 'remain this month'}
        </span>
        <span>{isFull ? '' : `Resets ${CAPACITY.nextReset}`}</span>
      </div>
    </div>
  )
}
