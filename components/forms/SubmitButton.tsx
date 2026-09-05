import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? 'Sending…' : children}
    </Button>
  )
}
