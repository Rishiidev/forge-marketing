import { CAPACITY } from '@/lib/constants'
import { Text } from '@/components/ui/Text'

/**
 * The legacy capacity-cap mechanism (legacy/index.html), reimplemented as
 * a plain, reusable component reading from a single config object
 * (lib/constants.ts CAPACITY) instead of an inline <script> constant.
 * That "one number drives the whole page" property is preserved: change
 * CAPACITY once, every usage of this component updates.
 */
export function CapacityStrip() {
  // Real mechanism, unconfirmed current numbers — see lib/constants.ts
  // CAPACITY.status and docs/conversion-architecture.md: no urgency is
  // better than fake urgency.
  if (CAPACITY.status === 'tbd') return null

  const isFull = CAPACITY.remaining <= 0
  const fillPct = Math.round(((CAPACITY.total - CAPACITY.remaining) / CAPACITY.total) * 100)

  return (
    <div
      className="max-w-md rounded-2xl border border-border bg-paper-2 p-5"
      data-state={isFull ? 'full' : 'open'}
      aria-live="polite"
    >
      <div className="mb-2 flex items-baseline justify-between text-body-sm text-muted">
        <strong className="text-ink">This month</strong>
        <span>{isFull ? 'Cap full' : 'Live capacity'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-3">
        <div
          className="h-full rounded-full bg-ground transition-[width] duration-300 ease-forge"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between">
        <Text as="span" size="caption" className="font-normal normal-case tracking-normal">
          <strong className="text-ink">
            {isFull ? 'Cap full' : `${CAPACITY.remaining} of ${CAPACITY.total} launch slots`}
          </strong>{' '}
          {isFull ? '— waitlist open' : 'remain this month'}
        </Text>
        <Text as="span" size="caption" className="font-normal normal-case tracking-normal">
          {isFull ? '' : `Resets ${CAPACITY.nextReset}`}
        </Text>
      </div>
    </div>
  )
}
