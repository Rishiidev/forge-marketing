import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findForbiddenDependencies, validateToolDefinition } from '../cost-policy'
import { TOOLS } from '../../constants'
import type { ToolDefinition } from '../types'

/**
 * Enforcement tests for docs/tools-cost-policy.md. These are the
 * developer-facing guardrail the policy doc asks for: a paid dependency
 * or an incomplete tool declaration fails `npm run test`, not a code
 * review someone might skip.
 */

describe('zero-cost dependency policy', () => {
  it('package.json declares no forbidden paid-provider dependency', () => {
    const pkgPath = join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(findForbiddenDependencies(pkg)).toEqual([])
  })
})

describe('tool metadata completeness (lib/constants.ts TOOLS)', () => {
  it('every declared tool passes full cost/security/data-source validation', () => {
    for (const tool of TOOLS) {
      expect(validateToolDefinition(tool)).toEqual([])
    }
  })

  it('no tool declares a data source classified PAID_NOT_ALLOWED', () => {
    for (const tool of TOOLS) {
      for (const ds of tool.dataSources) {
        expect(ds.costClassification).not.toBe('PAID_NOT_ALLOWED')
      }
    }
  })

  it('every tool has a security policy', () => {
    for (const tool of TOOLS) {
      expect(tool.securityPolicy).toBeDefined()
      expect(tool.securityPolicy.rateLimitPerIp).toBeTruthy()
      expect(tool.securityPolicy.dataRetention).toBeTruthy()
    }
  })

  it('every tool declares at least one explicit data source', () => {
    for (const tool of TOOLS) {
      expect(tool.dataSources.length).toBeGreaterThan(0)
    }
  })

  it('a future-paid tool is never marked available', () => {
    for (const tool of TOOLS) {
      if (tool.availability === 'future-paid') {
        expect(tool.status).not.toBe('available')
      }
    }
  })
})

describe('validateToolDefinition() itself', () => {
  const validTool: ToolDefinition = {
    slug: 'example',
    name: 'Example Tool',
    shortDescription: 'A deterministic example.',
    description: 'A deterministic example, for the validator test fixture only.',
    category: 'business-basics',
    intent: 'See a worked example of a valid tool declaration.',
    inputType: 'form',
    inputFields: [{ id: 'businessName', label: 'Business name', type: 'text', required: true, maxLength: 100 }],
    run: () => ({
      toolSlug: 'example',
      generatedAt: new Date().toISOString(),
      cached: false,
      summary: 'Example result.',
      findings: [],
      overallStatus: 'success',
    }),
    status: 'available',
    availability: 'free',
    costProfile: { classification: 'FREE_INTERNAL', monthlyCostEstimateUsd: 0, notes: 'Pure TS logic, no network call.' },
    dataSources: [
      {
        id: 'internal-heuristics',
        name: 'Internal scoring logic',
        costClassification: 'FREE_INTERNAL',
        description: 'Deterministic, self-contained.',
        requiresApiKey: false,
      },
    ],
    capabilities: [{ id: 'score', label: 'Score', description: 'Computes a score.', dataSource: { id: 'internal-heuristics', name: 'x', costClassification: 'FREE_INTERNAL', description: 'x', requiresApiKey: false } }],
    securityPolicy: {
      acceptsUserSuppliedUrl: false,
      ssrfMitigation: 'n/a — no user-supplied URL is fetched',
      rateLimitPerIp: '20 requests / 10 min / IP-ish key',
      inputValidation: 'All fields validated client- and server-side before use.',
      dataRetention: 'none — computed and returned, nothing persisted',
    },
    seo: { title: 'Example Tool', description: 'A deterministic example.' },
    relatedTools: [],
    primaryCTA: { headline: 'Want us to check the rest?', description: 'See what to fix first.', label: 'Get your free audit', href: '/audit', location: 'example-tool' },
  }

  it('accepts a fully-specified, zero-cost tool', () => {
    expect(validateToolDefinition(validTool)).toEqual([])
  })

  it('rejects a data source classified PAID_NOT_ALLOWED', () => {
    const bad: ToolDefinition = {
      ...validTool,
      dataSources: [{ ...validTool.dataSources[0]!, costClassification: 'PAID_NOT_ALLOWED' }],
    }
    const issues = validateToolDefinition(bad)
    expect(issues.some((i) => i.includes('PAID_NOT_ALLOWED'))).toBe(true)
  })

  it('rejects a future-paid tool marked available', () => {
    const bad: ToolDefinition = { ...validTool, availability: 'future-paid', status: 'available' }
    const issues = validateToolDefinition(bad)
    expect(issues.some((i) => i.includes('future-paid'))).toBe(true)
  })

  it('rejects a data source that requires an API key but names no env var', () => {
    const bad: ToolDefinition = {
      ...validTool,
      dataSources: [{ ...validTool.dataSources[0]!, requiresApiKey: true, apiKeyEnvVar: undefined }],
    }
    const issues = validateToolDefinition(bad)
    expect(issues.some((i) => i.includes('apiKeyEnvVar'))).toBe(true)
  })

  it('rejects a tool with an incomplete security policy', () => {
    const bad: ToolDefinition = { ...validTool, securityPolicy: { ...validTool.securityPolicy, rateLimitPerIp: '' } }
    const issues = validateToolDefinition(bad)
    expect(issues.some((i) => i.includes('rateLimitPerIp'))).toBe(true)
  })
})

describe('findForbiddenDependencies()', () => {
  it('flags a known paid provider by name', () => {
    expect(findForbiddenDependencies({ dependencies: { openai: '^4.0.0' } })).toContain('openai')
    expect(findForbiddenDependencies({ dependencies: { '@anthropic-ai/sdk': '^1.0.0' } })).toContain('@anthropic-ai/sdk')
  })

  it('does not flag an unrelated dependency', () => {
    expect(findForbiddenDependencies({ dependencies: { react: '^19.0.0', clsx: '^2.1.1' } })).toEqual([])
  })
})
