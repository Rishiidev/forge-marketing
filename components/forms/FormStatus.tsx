import { cn } from '@/lib/utils'

export type FormStatusState = 'idle' | 'pending' | 'success' | 'error'

export function FormStatus({ status, error }: { status: FormStatusState; error?: string | null }) {
  if (status === 'idle' || status === 'pending') return null

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('mt-3 text-body-sm', status === 'success' ? 'text-success' : 'text-warm')}
    >
      {status === 'success'
        ? "Request received. We'll follow up shortly."
        : (error ?? 'Something went wrong. Please try again.')}
    </p>
  )
}
