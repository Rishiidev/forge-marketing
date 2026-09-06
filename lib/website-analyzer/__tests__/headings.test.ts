import { describe, expect, it } from 'vitest'
import { parseHtml } from '../html-parser'
import { extractHeadings, buildHeadingsFindings } from '../headings'

describe('extractHeadings()', () => {
  it('detects a single, clean H1', () => {
    const $ = parseHtml('<body><h1>Welcome</h1><h2>Services</h2><h3>Haircuts</h3></body>')!
    const evidence = extractHeadings($)
    expect(evidence.h1Count).toBe(1)
    expect(evidence.h1Texts).toEqual(['Welcome'])
    expect(evidence.h2Count).toBe(1)
    expect(evidence.h3Count).toBe(1)
    expect(evidence.hasSkippedLevel).toBe(false)
  })

  it('detects multiple H1s — the specific case the brief calls out', () => {
    const $ = parseHtml('<body><h1>First</h1><h1>Second</h1></body>')!
    const evidence = extractHeadings($)
    expect(evidence.h1Count).toBe(2)
    expect(evidence.h1Texts).toEqual(['First', 'Second'])
  })

  it('detects zero H1s (missing hierarchy)', () => {
    const $ = parseHtml('<body><h2>Only an H2</h2></body>')!
    expect(extractHeadings($).h1Count).toBe(0)
  })

  it('detects a skipped heading level (H1 straight to H3)', () => {
    const $ = parseHtml('<body><h1>Title</h1><h3>Skipped H2</h3></body>')!
    expect(extractHeadings($).hasSkippedLevel).toBe(true)
  })

  it('does not flag going back up a level as a skip (H3 then H1 then H2 is fine)', () => {
    const $ = parseHtml('<body><h1>A</h1><h2>B</h2><h3>C</h3><h1>D</h1><h2>E</h2></body>')!
    expect(extractHeadings($).hasSkippedLevel).toBe(false)
  })

  it('detects repeated heading text (case-insensitive)', () => {
    const $ = parseHtml('<body><h1>Welcome</h1><h2>Our Services</h2><h2>our services</h2></body>')!
    const evidence = extractHeadings($)
    expect(evidence.duplicateHeadingTexts).toContain('our services')
  })

  it('does not throw on malformed HTML with unclosed heading tags', () => {
    const malformed = '<body><h1>Unclosed<h2>Nested wrong</h1></body>'
    expect(() => extractHeadings(parseHtml(malformed)!)).not.toThrow()
  })

  it('ignores empty headings (no text content)', () => {
    const $ = parseHtml('<body><h1>   </h1><h1>Real Title</h1></body>')!
    expect(extractHeadings($).h1Count).toBe(1)
  })
})

describe('buildHeadingsFindings()', () => {
  it('flags zero H1s as critical', () => {
    const findings = buildHeadingsFindings(extractHeadings(parseHtml('<body><h2>x</h2></body>')!))
    expect(findings.find((f) => f.id === 'headings-h1')!.severity).toBe('critical')
  })

  it('flags multiple H1s as a warning, not critical', () => {
    const findings = buildHeadingsFindings(extractHeadings(parseHtml('<body><h1>A</h1><h1>B</h1></body>')!))
    expect(findings.find((f) => f.id === 'headings-h1')!.severity).toBe('warning')
  })

  it('a single clean H1 with no skips is good', () => {
    const findings = buildHeadingsFindings(extractHeadings(parseHtml('<body><h1>A</h1><h2>B</h2></body>')!))
    expect(findings.find((f) => f.id === 'headings-h1')!.severity).toBe('good')
    expect(findings.find((f) => f.id === 'headings-hierarchy')!.severity).toBe('good')
  })
})
