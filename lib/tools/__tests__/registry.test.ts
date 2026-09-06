import { describe, expect, it } from 'vitest'
import { getAllTools, getAvailableToolBySlug, getAvailableTools, getRelatedTools, getToolBySlug, getToolsByCategory } from '../registry'
import { TOOLS } from '../../constants'

/**
 * Registry behavior, proven against the real, now-populated TOOLS array
 * (the 12 website-analyzer tools, lib/website-analyzer/tools.ts). This
 * file originally proved these functions correct against a deliberately
 * empty TOOLS (docs/tools-cost-policy.md's zero-cost-tools phase) —
 * updated here now that real tools exist, rather than left asserting a
 * "today, empty" state that stopped being true the moment the first real
 * tool shipped.
 */

describe('registry — against the real, populated TOOLS', () => {
  it('getAllTools() returns the same array TOOLS is', () => {
    expect(getAllTools()).toBe(TOOLS)
  })

  it('TOOLS is genuinely populated now (not the old empty-registry phase)', () => {
    expect(TOOLS.length).toBeGreaterThan(0)
  })

  it('getAvailableTools() returns exactly the tools marked available', () => {
    expect(getAvailableTools()).toEqual(TOOLS.filter((tool) => tool.status === 'available'))
    expect(getAvailableTools().length).toBeGreaterThan(0)
  })

  it('getToolBySlug()/getAvailableToolBySlug() resolve a real, known slug', () => {
    expect(getToolBySlug('website-seo-audit')?.slug).toBe('website-seo-audit')
    expect(getAvailableToolBySlug('website-seo-audit')?.slug).toBe('website-seo-audit')
  })

  it('getToolBySlug()/getAvailableToolBySlug() return undefined for a slug that does not exist', () => {
    expect(getToolBySlug('does-not-exist')).toBeUndefined()
    expect(getAvailableToolBySlug('does-not-exist')).toBeUndefined()
  })

  it('getToolsByCategory() returns only available tools in that category', () => {
    const seoTools = getToolsByCategory('seo')
    expect(seoTools.length).toBeGreaterThan(0)
    for (const tool of seoTools) {
      expect(tool.category).toBe('seo')
      expect(tool.status).toBe('available')
    }
  })

  it('getToolsByCategory() returns an empty array for a category with no tools yet', () => {
    expect(getToolsByCategory('business-basics')).toEqual([])
  })
})

describe('getRelatedTools()', () => {
  const baseSecurity = {
    acceptsUserSuppliedUrl: false,
    ssrfMitigation: 'n/a',
    rateLimitPerIp: '20 / 10 min',
    inputValidation: 'x',
    dataRetention: 'none',
  }
  const baseDataSource = { id: 'internal', name: 'x', costClassification: 'FREE_INTERNAL' as const, description: 'x', requiresApiKey: false }

  function makeFixture(overrides: { category: 'seo' | 'business-basics'; relatedTools: string[] }) {
    return {
      slug: 'a',
      name: 'a',
      shortDescription: 'a',
      description: 'a',
      category: overrides.category,
      intent: 'x',
      inputType: 'form' as const,
      inputFields: [],
      run: () => ({ toolSlug: 'a', generatedAt: '', cached: false, summary: '', findings: [], overallStatus: 'success' as const }),
      status: 'available' as const,
      availability: 'free' as const,
      costProfile: { classification: 'FREE_INTERNAL' as const, monthlyCostEstimateUsd: 0 as const, notes: 'x' },
      dataSources: [baseDataSource],
      capabilities: [{ id: 'x', label: 'x', description: 'x', dataSource: baseDataSource }],
      securityPolicy: baseSecurity,
      seo: { title: 'a', description: 'a' },
      relatedTools: overrides.relatedTools,
      primaryCTA: { headline: 'x', description: 'x', label: 'x', href: '/audit', location: 'a' },
    }
  }

  it('never throws and drops relatedTools slugs that do not resolve to a real, available tool', () => {
    const fixture = makeFixture({ category: 'business-basics', relatedTools: ['b', 'does-not-exist'] })
    expect(getRelatedTools(fixture)).toEqual([])
  })

  it('falls back to other available tools in the same category once explicit relatedTools resolve to nothing', () => {
    const fixture = makeFixture({ category: 'seo', relatedTools: ['b', 'does-not-exist'] })
    const seoTools = getToolsByCategory('seo')
    expect(getRelatedTools(fixture)).toEqual(seoTools.slice(0, 3))
  })

  it('respects the limit parameter against the same-category fallback', () => {
    const fixture = makeFixture({ category: 'seo', relatedTools: [] })
    const seoTools = getToolsByCategory('seo')
    expect(getRelatedTools(fixture, 1)).toEqual(seoTools.slice(0, 1))
  })

  it('respects the limit parameter even with nothing to return', () => {
    const fixture = makeFixture({ category: 'business-basics', relatedTools: [] })
    expect(getRelatedTools(fixture, 1)).toEqual([])
  })
})
