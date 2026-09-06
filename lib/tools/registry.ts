/**
 * The central tools registry — a domain layer on top of
 * lib/constants.ts's `TOOLS` array, the same relationship lib/blog.ts
 * and lib/showcases.ts already have to lib/content.ts (ADR-002/ADR-008):
 * the raw data stays in lib/constants.ts (this project's single source
 * of truth for business data, per docs/architecture.md), and this file
 * is where lookup/filtering logic that would otherwise be duplicated
 * across every consumer (ToolGrid, the [slug] page, RelatedTools,
 * app/sitemap.ts) lives once.
 *
 * `TOOLS` is still `[]` as of this file's creation — no individual tool
 * has been built yet (docs/tool-cost-matrix.md). Every function here is
 * exercised by lib/tools/__tests__/registry.test.ts against that
 * still-empty array, so its behavior is proven correct before the first
 * real tool ever populates it.
 *
 * Client-safe: no secrets, no server-only import.
 */

import { TOOLS } from '@/lib/constants'
import type { ToolCategory, ToolDefinition } from './types'

/** Every declared tool, regardless of status — rarely what a page wants directly; prefer getAvailableTools(). */
export function getAllTools(): ToolDefinition[] {
  return TOOLS
}

/** Only tools a visitor can actually use right now. The UI must never present a 'planned'/'unavailable'/'future-paid' tool as if it were this. */
export function getAvailableTools(): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.status === 'available')
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

/** Same "only if actually usable" rule as getAvailableTools(), scoped to one slug — what app/tools/[slug]/page.tsx should call, not getToolBySlug() directly. */
export function getAvailableToolBySlug(slug: string): ToolDefinition | undefined {
  return getAvailableTools().find((tool) => tool.slug === slug)
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getAvailableTools().filter((tool) => tool.category === category)
}

/**
 * Resolves a tool's declared `relatedTools` slugs to real, available
 * tool definitions — silently drops a slug that doesn't resolve (a typo,
 * or a tool that's since been unpublished) rather than letting
 * components/tools/RelatedTools.tsx render a broken card. Falls back to
 * other tools in the same category (excluding itself) when a tool
 * declares no related slugs at all, capped at `limit`, so the section
 * has something useful once a second tool in the same category exists —
 * same "never an empty related section once alternatives exist" pattern
 * lib/blog.ts's getRelatedPosts() already establishes.
 */
export function getRelatedTools(tool: ToolDefinition, limit = 3): ToolDefinition[] {
  const explicit = tool.relatedTools
    .map((slug) => getAvailableToolBySlug(slug))
    .filter((t): t is ToolDefinition => Boolean(t) && t!.slug !== tool.slug)

  if (explicit.length >= limit) return explicit.slice(0, limit)

  const sameCategory = getToolsByCategory(tool.category).filter(
    (t) => t.slug !== tool.slug && !explicit.some((e) => e.slug === t.slug)
  )

  return [...explicit, ...sameCategory].slice(0, limit)
}
