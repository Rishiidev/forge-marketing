import { describe, expect, it } from 'vitest'
import {
  buildToolResult,
  computeOverallStatus,
  failedFinding,
  inferredFinding,
  notCheckedFinding,
  summarizeByCategory,
  unavailableFinding,
  verifiedFinding,
} from '../results'

/**
 * The honesty-contract tests, per the standing instruction this module
 * encodes: an inferred/self-reported/unavailable fact must never come
 * out of these builders tagged 'verified'. If a future edit to
 * lib/tools/results.ts ever blurs that line, this file should fail.
 */

describe('finding builders — each tags its own, distinct resultCategory', () => {
  it('verifiedFinding() is the only builder that produces "verified"', () => {
    const f = verifiedFinding({ id: 'a', label: 'A', detail: 'Confirmed directly.' })
    expect(f.resultCategory).toBe('verified')
  })

  it('inferredFinding() never produces "verified"', () => {
    const f = inferredFinding({ id: 'a', label: 'A', detail: 'Estimated from a self-report answer.' })
    expect(f.resultCategory).toBe('inferred')
    expect(f.resultCategory).not.toBe('verified')
  })

  it('unavailableFinding() never produces "verified" and is distinct from "not_checked"', () => {
    const f = unavailableFinding({ id: 'a', label: 'A', detail: 'No zero-cost source exists for this.' })
    expect(f.resultCategory).toBe('unavailable')
    expect(f.resultCategory).not.toBe('verified')
    expect(f.resultCategory).not.toBe('not_checked')
  })

  it('notCheckedFinding() never produces "verified"', () => {
    const f = notCheckedFinding({ id: 'a', label: 'A', detail: 'Visitor skipped this optional field.' })
    expect(f.resultCategory).toBe('not_checked')
  })

  it('failedFinding() never produces "verified" and defaults to a warning severity', () => {
    const f = failedFinding({ id: 'a', label: 'A', detail: 'The check errored out.' })
    expect(f.resultCategory).toBe('failed')
    expect(f.severity).toBe('warning')
  })

  it('every builder accepts an explicit severity override without changing its resultCategory', () => {
    const f = inferredFinding({ id: 'a', label: 'A', detail: 'x', severity: 'critical' })
    expect(f.severity).toBe('critical')
    expect(f.resultCategory).toBe('inferred')
  })
})

describe('computeOverallStatus()', () => {
  it('is "success" for an empty finding list', () => {
    expect(computeOverallStatus([])).toBe('success')
  })

  it('is "success" when every finding is verified/inferred/unavailable/not_checked', () => {
    const findings = [
      verifiedFinding({ id: 'a', label: 'A', detail: 'x' }),
      inferredFinding({ id: 'b', label: 'B', detail: 'x' }),
      unavailableFinding({ id: 'c', label: 'C', detail: 'x' }),
      notCheckedFinding({ id: 'd', label: 'D', detail: 'x' }),
    ]
    expect(computeOverallStatus(findings)).toBe('success')
  })

  it('is "partial" as soon as any finding failed — an honest gap does not count as a failure, but an errored check does', () => {
    const findings = [verifiedFinding({ id: 'a', label: 'A', detail: 'x' }), failedFinding({ id: 'b', label: 'B', detail: 'x' })]
    expect(computeOverallStatus(findings)).toBe('partial')
  })
})

describe('buildToolResult()', () => {
  it('assembles a complete ToolResult, defaulting cached to false', () => {
    const result = buildToolResult({
      toolSlug: 'example',
      summary: 'One finding.',
      findings: [verifiedFinding({ id: 'a', label: 'A', detail: 'x' })],
    })
    expect(result.toolSlug).toBe('example')
    expect(result.cached).toBe(false)
    expect(result.overallStatus).toBe('success')
    expect(result.findings).toHaveLength(1)
    expect(typeof result.generatedAt).toBe('string')
  })

  it('derives overallStatus from the findings, matching computeOverallStatus()', () => {
    const result = buildToolResult({
      toolSlug: 'example',
      summary: 'x',
      findings: [failedFinding({ id: 'a', label: 'A', detail: 'x' })],
    })
    expect(result.overallStatus).toBe('partial')
  })
})

describe('summarizeByCategory()', () => {
  it('counts every category, including zero-count ones', () => {
    const counts = summarizeByCategory([verifiedFinding({ id: 'a', label: 'A', detail: 'x' }), verifiedFinding({ id: 'b', label: 'B', detail: 'x' })])
    expect(counts).toEqual({ verified: 2, inferred: 0, unavailable: 0, not_checked: 0, failed: 0 })
  })
})
