import { describe, expect, it } from 'vitest'
import { parseHtml } from '../html-parser'
import { extractSchema, buildSchemaFindings } from '../schema'

function docWithLdJson(json: string) {
  return parseHtml(`<html><head><script type="application/ld+json">${json}</script></head></html>`)!
}

describe('extractSchema() — "do not claim schema is valid merely because JSON parses"', () => {
  it('NOT_FOUND when there is no JSON-LD at all', () => {
    const $ = parseHtml('<html><head></head></html>')!
    const evidence = extractSchema($)
    expect(evidence.scriptCount).toBe(0)
    expect(evidence.detected.LocalBusiness).toBeNull()
  })

  it('malformed JSON-LD is caught, never thrown, and marked as a parse error', () => {
    const $ = docWithLdJson('{ "@type": "Organization", "name": "Acme" ,,, broken json')
    expect(() => extractSchema($)).not.toThrow()
    const evidence = extractSchema($)
    expect(evidence.hasParseError).toBe(true)
    expect(evidence.scriptCount).toBe(1)
  })

  it('valid JSON that parses but is missing a required property is POTENTIALLY_INVALID, not silently PARSED as good', () => {
    // LocalBusiness requires name + address per EXPECTED_PROPERTIES — this has only name.
    const $ = docWithLdJson('{"@context":"https://schema.org","@type":"LocalBusiness","name":"Acme Salon"}')
    const evidence = extractSchema($)
    expect(evidence.detected.LocalBusiness).not.toBeNull()
    expect(evidence.detected.LocalBusiness!.status).toBe('POTENTIALLY_INVALID')
    expect(evidence.detected.LocalBusiness!.missingProperties).toContain('address')
  })

  it('valid JSON with every expected property present is PARSED (good)', () => {
    const $ = docWithLdJson('{"@context":"https://schema.org","@type":"LocalBusiness","name":"Acme Salon","address":{"@type":"PostalAddress","streetAddress":"1 Main St"}}')
    const evidence = extractSchema($)
    expect(evidence.detected.LocalBusiness!.status).toBe('PARSED')
    expect(evidence.detected.LocalBusiness!.missingProperties).toEqual([])
  })

  it('detects entities nested inside an @graph array', () => {
    const $ = docWithLdJson('{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Acme"},{"@type":"WebSite","name":"Acme Site"}]}')
    const evidence = extractSchema($)
    expect(evidence.detected.Organization).not.toBeNull()
    expect(evidence.detected.WebSite).not.toBeNull()
  })

  it('ignores an irrelevant @type not in the tracked list (e.g. BlogPosting) without crashing', () => {
    const $ = docWithLdJson('{"@type":"BlogPosting","headline":"A post"}')
    expect(() => extractSchema($)).not.toThrow()
    expect(extractSchema($).scriptCount).toBe(1)
  })
})

describe('buildSchemaFindings()', () => {
  it('produces one finding per tracked type, always — even when absent', () => {
    const $ = parseHtml('<html><head></head></html>')!
    const findings = buildSchemaFindings(extractSchema($))
    const ids = findings.map((f) => f.id)
    expect(ids).toContain('schema-localbusiness')
    expect(ids).toContain('schema-organization')
    expect(findings.find((f) => f.id === 'schema-localbusiness')!.status).toBe('NOT_FOUND')
  })

  it('a parse error produces its own warning finding, distinct from the per-type findings', () => {
    const $ = docWithLdJson('not json at all {{{')
    const findings = buildSchemaFindings(extractSchema($))
    expect(findings.some((f) => f.id === 'schema-parse-error')).toBe(true)
  })
})
