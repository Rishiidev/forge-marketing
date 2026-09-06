'use client'

import type { ToolError as ToolErrorType } from '@/lib/tools/types'
import { Button } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

/**
 * The execution state machine's 'error' terminal state. `role="alert"` +
 * `aria-live="assertive"` so an assistive-technology user hears this
 * immediately, without waiting to scan the page — distinct from
 * ToolStatus's `role="status"`/`aria-live="polite"`, which is for
 * routine transitions, not a failure that needs the visitor's attention.
 */
export function ToolError({ error, onRetry }: { error: ToolErrorType; onRetry?: () => void }) {
  return (
    <div role="alert" aria-live="assertive" className="rounded-2xl border border-border bg-white p-10 text-center">
      <Heading as="h3" size="heading-sm" className="mb-3">
        This didn&rsquo;t work.
      </Heading>
      <Text size="body" className="mb-6">
        {error.message}
      </Text>
      {error.retryable && onRetry && (
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
