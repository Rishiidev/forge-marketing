'use client'

import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/Button'
import { trackEvent } from '@/lib/analytics'

type ButtonProps = ComponentProps<typeof Button>

/**
 * A Button that also fires `website_cta_clicked`. Kept as its own small
 * Client Component so `ui/Button` itself stays a plain Server-renderable
 * primitive everywhere it's used without a tracking requirement — only
 * the repeated audit CTAs on the homepage pay the (tiny) client-JS cost
 * for this, per "avoid unnecessary client-side JavaScript."
 */
export function TrackedCtaLink({ location, ...props }: ButtonProps & { location: string }) {
  return <Button {...props} onClick={() => trackEvent({ name: 'website_cta_clicked', props: { location } })} />
}
