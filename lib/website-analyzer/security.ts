import 'server-only'

/**
 * The website analyzer's security surface — deliberately thin. All real
 * SSRF/fetch-safety logic (scheme/hostname/DNS-rebinding checks, the
 * manual redirect loop, timeout, response-size cap, Content-Type
 * validation) already lives in lib/tools/security.ts and is reused
 * as-is here, never reimplemented — the same "one engine, no duplicate
 * analysis logic" rule this whole module follows applies to security
 * checks too. Full threat model: docs/tool-security.md.
 *
 * This file only adds the analyzer-specific *policy* on top: what
 * timeouts/limits the homepage fetch itself uses (a real business
 * homepage, potentially large), what a much lighter robots.txt/
 * sitemap.xml/link-check fetch uses, and a couple of small,
 * analyzer-specific validation helpers that don't belong in the
 * generic engine.
 */

export { validateUrlForFetch, safeFetch, MAX_ANALYSIS_DEPTH, type SafeFetchOptions, type SafeFetchResult } from '@/lib/tools/security'

/** The homepage itself — allow a slightly larger body than the generic default, since a real business homepage's full HTML (not just visible text) is being parsed for meta/schema/links/images. */
export const HOMEPAGE_FETCH_OPTIONS = {
  timeoutMs: 8000,
  maxRedirects: 3,
  maxResponseBytes: 3_000_000, // 3MB
  allowedContentTypePrefixes: ['text/html'],
} as const

/**
 * /robots.txt and /sitemap.xml — small files; tighter timeout and size
 * cap than the homepage. Content-Type is deliberately unrestricted
 * (`['']` — every string starts with the empty string, so the check in
 * safeFetch() always passes): a 404-for-robots.txt is frequently served
 * as an HTML "not found" page rather than text/plain, and rejecting
 * that on Content-Type grounds would misreport a simple "doesn't exist"
 * as a fetch failure. lib/website-analyzer/robots.ts and sitemap.ts
 * inspect the actual status code and body themselves.
 */
export const AUXILIARY_FETCH_OPTIONS = {
  timeoutMs: 5000,
  maxRedirects: 2,
  maxResponseBytes: 1_000_000, // 1MB
  allowedContentTypePrefixes: [''],
} as const

/** A single internal link's reachability check (lib/website-analyzer/links.ts) — HEAD only, short timeout, no redirects followed beyond a couple hops. */
export const LINK_CHECK_FETCH_OPTIONS = {
  timeoutMs: 4000,
  maxRedirects: 2,
  maxResponseBytes: 0, // HEAD requests never read a body — see lib/tools/security.ts safeFetch()'s HEAD short-circuit
  allowedContentTypePrefixes: ['*'],
  method: 'HEAD' as const,
}

/** At most this many internal links are ever reachability-checked in one run — "obvious broken links where safely testable," not an exhaustive site-wide link audit. Bounded on purpose: docs/tool-security.md "No recursive crawling" applies to link-checking too, not just HTML fetching. */
export const MAX_LINKS_TO_CHECK = 5
