import { describe, expect, it } from 'vitest'
import { parseHtml } from '../html-parser'
import { extractLinks, summarizeLinks } from '../links'

const BASE = 'https://example.com/'

describe('extractLinks()', () => {
  it('classifies internal vs external links', () => {
    const $ = parseHtml(`<body><a href="/about">About</a><a href="https://other.com/">Other</a></body>`)!
    const links = extractLinks($, BASE)
    expect(links.find((l) => l.href === '/about')?.isInternal).toBe(true)
    expect(links.find((l) => l.href === 'https://other.com/')?.isInternal).toBe(false)
  })

  it('flags an empty href', () => {
    const $ = parseHtml(`<body><a href="">Empty</a></body>`)!
    const links = extractLinks($, BASE)
    expect(links[0]!.isEmpty).toBe(true)
  })

  it('flags a malformed href (contains whitespace / unparseable)', () => {
    const $ = parseHtml(`<body><a href="ht!tp://bad url with spaces">Bad</a></body>`)!
    const links = extractLinks($, BASE)
    expect(links[0]!.isMalformed).toBe(true)
  })

  it('does not flag mailto:/tel:/javascript:/in-page anchors as malformed', () => {
    const $ = parseHtml(`<body>
      <a href="mailto:hi@example.com">Mail</a>
      <a href="tel:+911234567890">Call</a>
      <a href="javascript:void(0)">JS</a>
      <a href="#section">Anchor</a>
    </body>`)!
    const links = extractLinks($, BASE)
    expect(links.every((l) => !l.isMalformed)).toBe(true)
    expect(links.every((l) => !l.isInternal)).toBe(true)
  })

  it('resolves a relative href against the base URL', () => {
    const $ = parseHtml(`<body><a href="services">Services</a></body>`)!
    const links = extractLinks($, BASE)
    expect(links[0]!.resolvedUrl).toBe('https://example.com/services')
  })

  it('does not throw on malformed HTML with unclosed anchor tags', () => {
    const malformed = '<body><a href="/a">Unclosed<a href="/b">Nested</body>'
    expect(() => extractLinks(parseHtml(malformed)!, BASE)).not.toThrow()
  })

  it('handles a missing href attribute gracefully (not just an empty one)', () => {
    const $ = parseHtml(`<body><a>No href at all</a></body>`)!
    expect(() => extractLinks($, BASE)).not.toThrow()
  })
})

describe('summarizeLinks()', () => {
  it('counts totals correctly', () => {
    const $ = parseHtml(`<body>
      <a href="/a">a</a>
      <a href="https://other.com/">b</a>
      <a href="">empty</a>
      <a href="bad url">malformed</a>
    </body>`)!
    const evidence = summarizeLinks(extractLinks($, BASE))
    expect(evidence.totalLinks).toBe(4)
    expect(evidence.internalCount).toBe(1)
    expect(evidence.externalCount).toBe(1)
    expect(evidence.emptyHrefCount).toBe(1)
    expect(evidence.malformedHrefs.length).toBe(1)
  })
})
