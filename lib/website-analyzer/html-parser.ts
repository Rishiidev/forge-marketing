/**
 * The one place HTML gets parsed. Every other check module in this
 * engine (metadata/headings/links/images/schema/mobile/local-signals/
 * content/social) receives an already-parsed document from here rather
 * than re-parsing the raw HTML string itself — this is the concrete
 * "do not duplicate analysis logic" rule applied to parsing, not just
 * to the fetch.
 *
 * Uses `cheerio` (MIT-licensed, zero-cost — docs/tools-cost-policy.md
 * §B category 8: an open-source npm package with no paid tier) rather
 * than hand-rolled regex, specifically because real-world business
 * homepage HTML is frequently malformed (unclosed tags, stray
 * ampersands, mismatched nesting) and cheerio's underlying parser
 * (parse5/htmlparser2) is lenient by design — it recovers instead of
 * throwing, which a regex-based approach cannot do reliably. Never
 * throws on malformed input; see parseHtml()'s own guard below and
 * lib/website-analyzer/__tests__/html-parser.test.ts.
 *
 * Client-safe: cheerio has no server-only requirement, but this module
 * is only ever called from server-side analyzer code in practice
 * (lib/website-analyzer/analyzer.ts runs inside a Server Action).
 */

import * as cheerio from 'cheerio'

export type ParsedDocument = cheerio.CheerioAPI

/**
 * Parses an HTML (or XML, for sitemap.ts) string. Returns null only for
 * genuinely unparseable input (not a string, or empty) — cheerio itself
 * tolerates malformed markup, so "parsed but mostly empty" is the
 * expected outcome for badly broken HTML, not a thrown exception.
 */
export function parseHtml(html: string, options?: { xmlMode?: boolean }): ParsedDocument | null {
  if (typeof html !== 'string' || html.trim().length === 0) return null
  try {
    return cheerio.load(html, options?.xmlMode ? { xml: true } : undefined)
  } catch {
    return null
  }
}

/** Visible text only — scripts/styles/noscript/template content stripped, whitespace collapsed. Shared by lib/website-analyzer/content.ts and lib/website-analyzer/local-signals.ts so both count/scan the same text. */
export function extractVisibleText($: ParsedDocument): string {
  const clone = $.root().clone()
  clone.find('script, style, noscript, template').remove()
  return clone.text().replace(/\s+/g, ' ').trim()
}
