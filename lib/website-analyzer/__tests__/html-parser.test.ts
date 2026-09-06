import { describe, expect, it } from 'vitest'
import { parseHtml, extractVisibleText } from '../html-parser'

describe('parseHtml()', () => {
  it('returns null for non-string input', () => {
    expect(parseHtml(null as unknown as string)).toBeNull()
    expect(parseHtml(undefined as unknown as string)).toBeNull()
  })

  it('returns null for empty/whitespace-only input', () => {
    expect(parseHtml('')).toBeNull()
    expect(parseHtml('   \n  ')).toBeNull()
  })

  it('parses well-formed HTML', () => {
    const $ = parseHtml('<html><head><title>Hi</title></head><body><h1>Hello</h1></body></html>')
    expect($).not.toBeNull()
    expect($!('title').text()).toBe('Hi')
  })

  it('does not throw on malformed HTML — unclosed tags, mismatched nesting, stray text', () => {
    const malformed = '<html><head><title>Broken<body><h1>Oops<p>unclosed<div>nested wrong</h1></div>'
    expect(() => parseHtml(malformed)).not.toThrow()
    const $ = parseHtml(malformed)
    expect($).not.toBeNull()
  })

  it('does not throw on a raw text fragment with no HTML structure at all', () => {
    expect(() => parseHtml('just some plain text, no tags')).not.toThrow()
  })

  it('does not throw on HTML with an unterminated comment or script', () => {
    const malformed = '<html><script>var x = "<html>whoops'
    expect(() => parseHtml(malformed)).not.toThrow()
  })

  it('parses XML mode for sitemap-shaped content', () => {
    const xml = '<?xml version="1.0"?><urlset><url><loc>https://example.com/</loc></url></urlset>'
    const $ = parseHtml(xml, { xmlMode: true })
    expect($).not.toBeNull()
    expect($!('urlset > url').length).toBe(1)
  })
})

describe('extractVisibleText()', () => {
  it('strips script/style/noscript content from the visible text', () => {
    const $ = parseHtml('<body><p>Real text</p><script>var x = "hidden script text"</script><style>.a{color:red}</style></body>')!
    const text = extractVisibleText($)
    expect(text).toContain('Real text')
    expect(text).not.toContain('hidden script text')
    expect(text).not.toContain('color:red')
  })

  it('collapses whitespace', () => {
    const $ = parseHtml('<body><p>Hello\n\n   World</p></body>')!
    expect(extractVisibleText($)).toBe('Hello World')
  })
})
