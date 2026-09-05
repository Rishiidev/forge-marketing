'use client'

import { SITE } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'

/**
 * Renders nothing until a real WhatsApp number is configured
 * (lib/constants.ts SITE.whatsappNumber). The legacy site shipped this
 * button on every page pointed at the literal placeholder
 * '919999999999' — that's a broken contact method presented as a working
 * one. This component refuses to do that: no number, no button.
 */
export function WhatsAppFloat({ location = 'float' }: { location?: string }) {
  if (!SITE.whatsappNumber) return null

  const href = `https://wa.me/${SITE.whatsappNumber}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent({ name: 'whatsapp_click', props: { location } })}
      aria-label="Chat with Forge on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ground text-mark shadow-lg transition-transform hover:-translate-y-0.5"
    >
      WA
    </a>
  )
}
