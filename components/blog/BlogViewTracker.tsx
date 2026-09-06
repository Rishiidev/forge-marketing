'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Fires the `blog_viewed` event once per mount. `blog_viewed` was
 * defined in the analytics taxonomy but left unwired — same situation
 * `showcase_viewed` was in before `ShowcaseViewTracker` (ADR-008).
 */
export function BlogViewTracker({ slug }: { slug: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackEvent({ name: 'blog_viewed', props: { slug } })
  }, [slug])

  return null
}
