import 'server-only'

/**
 * In-memory, single-process, fixed-window rate limiter.
 *
 * Honest limitation, stated up front: this resets on every server
 * restart/redeploy and does not share state across multiple serverless
 * instances or regions. It is a real but partial mitigation against
 * scripted abuse of a single running instance — not a hard guarantee,
 * and not a substitute for a shared store (e.g. Redis/Upstash) in front
 * of a multi-instance deployment. No such store is wired here because no
 * credential for one was provided — see docs/crm.md "Known limitations."
 * Swap this module's internals for a shared-store client later without
 * changing any call site, if that becomes necessary.
 *
 * Additional caveat specific to this framework (docs/decisions.md
 * ADR-013): a plain module-level Map like this one is only reliably
 * shared across calls from the *same* Next.js bundle. Today every call
 * site is inside app/actions.ts's Server Actions, so this works
 * correctly — but if a future Route Handler also needs rate limiting,
 * check-in from there won't share buckets with the Server Actions'
 * calls. lib/crm.ts's console provider hit exactly this problem for
 * cross-boundary lead lookups and was moved to a file-backed store
 * (lib/file-store.ts) to fix it — do the same here if a Route Handler
 * ever needs this.
 */

interface Bucket {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

// Defensive cap so a flood of distinct keys (e.g. spoofed/rotating IPs)
// can't grow this map unboundedly between restarts.
const MAX_TRACKED_KEYS = 5000

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export function checkRateLimit(key: string, opts: { max: number; windowMs: number }): RateLimitResult {
  const now = Date.now()

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, b] of buckets) {
      if (now - b.windowStart >= opts.windowMs) buckets.delete(k)
    }
  }

  const existing = buckets.get(key)
  if (!existing || now - existing.windowStart >= opts.windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: opts.max - 1 }
  }

  if (existing.count >= opts.max) {
    return { allowed: false, remaining: 0 }
  }

  existing.count += 1
  return { allowed: true, remaining: opts.max - existing.count }
}
