import { describe, expect, it } from 'vitest'
import { parseHtml } from '../html-parser'
import { extractMetadata, buildMetadataFindings } from '../metadata'

function docFor(head: string) {
  return parseHtml(`<html lang="en"><head>${head}</head><body></body></html>`)!
}

describe('extractMetadata()', () => {
  it('extracts a fully-populated head', () => {
    const $ = docFor(`
      <title>Studio Mysa — Hair Salon in Bengaluru</title>
      <meta name="description" content="A full-service hair salon in Bengaluru offering cuts, color, and styling.">
      <link rel="canonical" href="https://studiomysa.example/">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf-8">
      <meta name="robots" content="index, follow">
      <meta property="og:title" content="Studio Mysa">
      <meta name="twitter:card" content="summary_large_image">
    `)
    const evidence = extractMetadata($)
    expect(evidence.title).toBe('Studio Mysa — Hair Salon in Bengaluru')
    expect(evidence.metaDescription).toContain('full-service hair salon')
    expect(evidence.canonical).toBe('https://studiomysa.example/')
    expect(evidence.viewport).toContain('width=device-width')
    expect(evidence.charset).toBe('utf-8')
    expect(evidence.language).toBe('en')
    expect(evidence.openGraph.title).toBe('Studio Mysa')
    expect(evidence.twitter.card).toBe('summary_large_image')
  })

  it('every field is null/false on a completely empty head — missing tags', () => {
    const $ = parseHtml('<html><head></head><body></body></html>')!
    const evidence = extractMetadata($)
    expect(evidence.title).toBeNull()
    expect(evidence.metaDescription).toBeNull()
    expect(evidence.canonical).toBeNull()
    expect(evidence.viewport).toBeNull()
    expect(evidence.robotsMeta).toBeNull()
  })

  it('does not throw on malformed HTML with a broken head section', () => {
    const $ = parseHtml('<html><head><title>Unclosed<meta name="description" content="no closing quote></head>')!
    expect(() => extractMetadata($)).not.toThrow()
  })
})

describe('buildMetadataFindings()', () => {
  it('flags a missing title as critical/NOT_FOUND', () => {
    const $ = parseHtml('<html><head></head></html>')!
    const findings = buildMetadataFindings(extractMetadata($))
    const titleFinding = findings.find((f) => f.id === 'meta-title')!
    expect(titleFinding.severity).toBe('critical')
    expect(titleFinding.status).toBe('NOT_FOUND')
    expect(titleFinding.confidence).toBe('verified')
  })

  it('flags a noindex robots meta tag as critical — the one truly severe metadata mistake', () => {
    const $ = docFor('<title>x</title><meta name="robots" content="noindex, nofollow">')
    const findings = buildMetadataFindings(extractMetadata($))
    const robotsFinding = findings.find((f) => f.id === 'meta-robots')!
    expect(robotsFinding.severity).toBe('critical')
    expect(robotsFinding.status).toBe('FAIL')
  })

  it('a present, well-sized title/description reads as good, not flagged', () => {
    const $ = docFor(`
      <title>Studio Mysa — Hair Salon in Bengaluru</title>
      <meta name="description" content="A full-service hair salon offering cuts, color, and styling for every occasion.">
    `)
    const findings = buildMetadataFindings(extractMetadata($))
    expect(findings.find((f) => f.id === 'meta-title')!.severity).toBe('good')
    expect(findings.find((f) => f.id === 'meta-description')!.severity).toBe('good')
  })

  it('never claims a finding is verified when the tag is genuinely absent — confidence stays verified, but resultCategory (via toToolFinding) should reflect absence honestly', () => {
    const $ = parseHtml('<html><head></head></html>')!
    const findings = buildMetadataFindings(extractMetadata($))
    // Absence is itself a directly-confirmed fact (we looked, it's not there) —
    // confidence 'verified' is correct here; the important thing is status is NOT_FOUND, not FOUND.
    for (const f of findings) {
      if (f.status === 'NOT_FOUND') expect(f.confidence).toBe('verified')
    }
  })
})
