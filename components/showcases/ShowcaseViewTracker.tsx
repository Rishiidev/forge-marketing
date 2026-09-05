'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Fires the `showcase_viewed` event once per mount. Renders nothing.
 * `showcase_viewed` was defined in the analytics taxonomy
 * (docs/conversion-architecture.md §7) but deliberately left unwired on
 * the homepage — no page existed yet where "viewed" meant anything more
 * specific than "saw the homepage." /showcases/[slug] is that page.
 */
export function ShowcaseViewTracker({ slug }: { slug: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackEvent({ name: 'showcase_viewed', props: { slug } })
  }, [slug])

  return null
}
