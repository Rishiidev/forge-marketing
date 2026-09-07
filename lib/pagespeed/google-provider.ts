import 'server-only'
import { validateUrlForFetch } from '@/lib/tools/security'
import { normalizeGoogleResponse } from './normalizer'
import type { PageSpeedAnalysis, PageSpeedProvider, PageSpeedStrategy } from './provider'

/**
 * Real Google PageSpeed Insights v5 provider — entirely key-gated.
 *
 * "Do not add billing" is honored structurally, not just by policy: this
 * provider makes zero network calls unless `PSI_API_KEY` is set in the
 * environment, and no `.env` exists anywhere in this repository (the
 * same standing fact `docs/crm.md`/`docs/architecture.md` already state
 * about every other optional integration here) — so on Forge's actual
 * deployment, as shipped, this code path never runs at all. A human who
 * wants live PageSpeed data must set `PSI_API_KEY` themselves, outside
 * this repo; whether obtaining one requires enabling billing on a
 * Google Cloud project is between that person and Google Cloud Console
 * at the time they do it (Google's own console flow, not something this
 * codebase controls or can verify in advance) — Forge's code never
 * creates a project, enables an API, or touches billing on anyone's
 * behalf.
 *
 * The unauthenticated (no-key) form of this endpoint does technically
 * exist, but Google's own docs discourage it for "frequent, automated
 * queries" — a public-facing Forge tool is exactly that, so this
 * provider never falls back to an unkeyed call. No key set = 'unavailable',
 * not a degraded, ban-risking attempt.
 */

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

// Lab runs are a real, server-side Lighthouse execution on Google's
// infrastructure — routinely 10-20+ seconds. Generous on purpose; a
// timeout here should mean Google is genuinely slow/unavailable, not
// that Forge cut it off prematurely.
const FETCH_TIMEOUT_MS = 25_000

export const googlePageSpeedProvider: PageSpeedProvider = {
  name: 'google-pagespeed-insights-v5',

  isConfigured(): boolean {
    return Boolean(process.env.PSI_API_KEY)
  },

  async analyze(url: string, strategy: PageSpeedStrategy): Promise<PageSpeedAnalysis> {
    const apiKey = process.env.PSI_API_KEY
    if (!apiKey) return { status: 'unavailable', reason: 'not-configured' }

    // Google's own servers fetch `url`, not Forge's — this isn't a
    // Forge-side SSRF exposure the way lib/website-analyzer/'s direct
    // fetches are. Still run it through the same check used everywhere
    // else in this codebase: it stops Forge's limited PSI quota being
    // spent on an obviously-malformed/private target, and stops this
    // endpoint being usable as a way to point Google's crawler at an
    // arbitrary internal address on someone else's network.
    const validation = await validateUrlForFetch(url)
    if (!validation.ok) return { status: 'unavailable', reason: 'invalid-url' }

    const params = new URLSearchParams({ url, strategy, key: apiKey })
    for (const category of ['performance', 'accessibility', 'best-practices']) params.append('category', category)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, { signal: controller.signal })
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === 'AbortError') return { status: 'unavailable', reason: 'timeout' }
      return { status: 'unavailable', reason: 'network-error' }
    }
    clearTimeout(timeout)

    if (!response.ok) {
      // Google returns 400 for a target it couldn't itself fetch/analyze,
      // 429 for quota exhaustion, 5xx for its own outages — every one of
      // these becomes an honest 'unavailable' with a specific reason,
      // never a fabricated result standing in for a real one.
      if (response.status === 429) return { status: 'unavailable', reason: 'quota-exceeded' }
      return { status: 'unavailable', reason: `http-${response.status}` }
    }

    let json: unknown
    try {
      json = await response.json()
    } catch {
      return { status: 'unavailable', reason: 'invalid-response' }
    }

    return normalizeGoogleResponse(json, strategy)
  },
}
