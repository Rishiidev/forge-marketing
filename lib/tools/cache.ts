import 'server-only'
import crypto from 'node:crypto'
import { readStore, writeStore } from '@/lib/file-store'
import type { ToolInput, ToolResult } from './types'

/**
 * Zero-cost result cache for server-executed tools — docs/tools-cost-policy.md
 * §F. File-backed (lib/file-store.ts), the same pattern lib/crm.ts's
 * console provider and lib/referrals.ts already use, and for the same
 * reason (ADR-013): a bare in-memory Map is not reliably shared between
 * a Route Handler and a Server Action in this framework, so anything
 * that must survive across that boundary goes through the filesystem
 * instead of a module-level Map.
 *
 * Not a real database — whole-file JSON read/write, no locking, no
 * concurrent-write safety, adequate for this project's current scale.
 * Same "no database exists here" posture as everywhere else
 * (docs/architecture.md "Why no CMS").
 *
 * Client-safe callers do not exist for this module — it's imported only
 * from a tool's server-side run() implementation or from
 * lib/tools/execution.ts's server path.
 */

interface CacheEntry {
  result: ToolResult
  expiresAt: string
}

function cacheFilename(toolSlug: string): string {
  // One file per tool — keeps a single popular tool's cache from ever
  // requiring the whole platform's cache file to be rewritten on every hit.
  return `tool-cache-${toolSlug}.json`
}

/**
 * Deterministic cache key from a tool's *validated* input — never the
 * raw, unvalidated visitor string (docs/tools-cost-policy.md §F item 2;
 * also a security requirement, not just a cost one — an unhashed raw
 * string used as a cache/file key is itself a path-traversal-adjacent
 * risk if it were ever used as a filename directly, which this function
 * exists specifically to avoid).
 */
export function buildCacheKey(input: ToolInput): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort())
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/** Returns the cached result if present and not expired; null otherwise (including "never cached"). */
export function getCachedResult(toolSlug: string, cacheKey: string): ToolResult | null {
  const store = readStore<CacheEntry>(cacheFilename(toolSlug))
  const entry = store[cacheKey]
  if (!entry) return null
  if (Date.parse(entry.expiresAt) <= Date.now()) return null
  return { ...entry.result, cached: true }
}

/**
 * Stores a result with an explicit expiry — docs/tools-cost-policy.md §F
 * item 5 requires every cached tool to define a retention window; there
 * is deliberately no default here, so a caller can't cache indefinitely
 * by omission.
 */
export function setCachedResult(toolSlug: string, cacheKey: string, result: ToolResult, ttlMs: number): void {
  const store = readStore<CacheEntry>(cacheFilename(toolSlug))
  store[cacheKey] = { result, expiresAt: new Date(Date.now() + ttlMs).toISOString() }
  writeStore(cacheFilename(toolSlug), store)
}

/** Drops every expired entry for one tool. Not called automatically — a tool (or a future scheduled task) calls this on its own schedule; an unbounded cache file is itself a soft cost (§F item 5). */
export function pruneExpiredCache(toolSlug: string): void {
  const store = readStore<CacheEntry>(cacheFilename(toolSlug))
  const now = Date.now()
  let changed = false
  for (const [key, entry] of Object.entries(store)) {
    if (Date.parse(entry.expiresAt) <= now) {
      delete store[key]
      changed = true
    }
  }
  if (changed) writeStore(cacheFilename(toolSlug), store)
}

/** Common, named windows so tool authors pick from a reviewed set rather than inventing a magic number per tool. */
export const CACHE_TTL = {
  SHORT: 15 * 60 * 1000, // 15 minutes — a result likely to change soon, or expensive only in bursts
  STANDARD: 6 * 60 * 60 * 1000, // 6 hours — the default for most homepage-only analysis
  LONG: 24 * 60 * 60 * 1000, // 24 hours — a fact unlikely to change same-day
} as const
