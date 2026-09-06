import { describe, expect, it } from 'vitest'
import { getAllTools, getAvailableToolBySlug, getAvailableTools, getRelatedTools, getToolBySlug, getToolsByCategory } from '../registry'
import { TOOLS } from '../../constants'

/**
 * Registry behavior, proven correct against the real (still-empty)
 * TOOLS array — see lib/tools/registry.ts's own doc comment for why
 * this matters before the first real tool ever populates it.
 */

describe('registry — against the real, currently-empty TOOLS', () => {
  it('getAllTools() returns the same array TOOLS is', () => {
    expect(getAllTools()).toBe(TOOLS)
  })

  it('getAvailableTools() returns an empty array today', () => {
    expect(getAvailableTools()).toEqual([])
  })

  it('getToolBySlug()/getAvailableToolBySlug() return undefined for any slug today', () => {
    expect(getToolBySlug('anything')).toBeUndefined()
    expect(getAvailableToolBySlug('anything')).toBeUndefined()
  })

  it('getToolsByCategory() returns an empty array for every category today', () => {
    expect(getToolsByCategory('seo')).toEqual([])
  })
})

describe('getRelatedTools() — against the real (currently empty) registry', () => {
  const baseSecurity = {
    acceptsUserSuppliedUrl: false,
    ssrfMitigation: 'n/a',
    rateLimitPerIp: '20 / 10 min',
    inputValidation: 'x',
    dataRetention: 'none',
  }
  const baseDataSource = { id: 'internal', name: 'x', costClassification: 'FREE_INTERNAL' as const, description: 'x', requiresApiKey: false }

  const fixture = {
    slug: 'a',
    name: 'a',
    shortDescription: 'a',
    description: 'a',
    category: 'seo' as const,
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
    relatedTools: ['b', 'does-not-exist'],
    primaryCTA: { headline: 'x', description: 'x', label: 'x', href: '/audit', location: 'a' },
  }

  it('never throws and drops relatedTools slugs that do not resolve to a real, available tool', () => {
    expect(getRelatedTools(fixture)).toEqual([])
  })

  it('respects the limit parameter even with nothing to return', () => {
    expect(getRelatedTools(fixture, 1)).toEqual([])
  })
})
