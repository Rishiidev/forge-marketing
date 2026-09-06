import type { ParsedDocument } from './html-parser'
import type { Finding } from './types'

/**
 * CHECK §6: structured data (JSON-LD) detection.
 *
 * "Do not claim schema is valid merely because JSON parses" — the
 * concrete rule this file follows: a script tag existing is FOUND; its
 * content parsing as JSON is PARSED; parsing *and* having the properties
 * a real consumer of that type would expect is what actually earns a
 * 'good' severity. Missing an expected property downgrades the finding
 * to POTENTIALLY_INVALID — never silently treated as fine, and never
 * asserted as definitively broken either (Forge has no real schema
 * validator — that would require a paid/hosted service — so this is
 * always a property-presence check, not a spec-conformance one).
 */

const TARGET_TYPES = ['Organization', 'LocalBusiness', 'Product', 'Service', 'FAQPage', 'BreadcrumbList', 'WebSite', 'WebPage'] as const
export type SchemaTargetType = (typeof TARGET_TYPES)[number]

/** The properties a real consumer (Google, a rich-result reader) would expect for each type to be minimally useful — not the full spec, a practical floor. */
const EXPECTED_PROPERTIES: Record<SchemaTargetType, string[]> = {
  Organization: ['name'],
  LocalBusiness: ['name', 'address'],
  Product: ['name'],
  Service: ['name'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  WebSite: ['name'],
  WebPage: [],
}

interface DetectedType {
  status: 'PARSED' | 'POTENTIALLY_INVALID'
  missingProperties: string[]
}

export interface SchemaEvidence {
  scriptCount: number
  hasParseError: boolean
  detected: Record<SchemaTargetType, DetectedType | null>
}

function flattenEntities(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed.flatMap(flattenEntities)
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>
    if (Array.isArray(obj['@graph'])) return (obj['@graph'] as unknown[]).flatMap(flattenEntities)
    return [obj]
  }
  return []
}

function normalizeTypes(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return []
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

export function extractSchema($: ParsedDocument): SchemaEvidence {
  const scripts = $('script[type="application/ld+json"]')
  let hasParseError = false
  const detected = new Map<SchemaTargetType, DetectedType>()

  scripts.each((_, el) => {
    const raw = $(el).text()
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      hasParseError = true
      return
    }

    for (const entity of flattenEntities(parsed)) {
      for (const type of normalizeTypes(entity['@type'])) {
        if (!(TARGET_TYPES as readonly string[]).includes(type)) continue
        const targetType = type as SchemaTargetType
        const missingProperties = EXPECTED_PROPERTIES[targetType].filter((prop) => isEmptyValue(entity[prop]))
        const status: DetectedType['status'] = missingProperties.length > 0 ? 'POTENTIALLY_INVALID' : 'PARSED'

        // If the same type appears more than once in the page, keep
        // whichever instance is more complete rather than the last one
        // seen — a partial duplicate shouldn't hide a good one.
        const existing = detected.get(targetType)
        if (!existing || (existing.status === 'POTENTIALLY_INVALID' && status === 'PARSED')) {
          detected.set(targetType, { status, missingProperties })
        }
      }
    }
  })

  const detectedRecord = {} as Record<SchemaTargetType, DetectedType | null>
  for (const type of TARGET_TYPES) detectedRecord[type] = detected.get(type) ?? null

  return { scriptCount: scripts.length, hasParseError, detected: detectedRecord }
}

const TYPE_EXPLAINER: Record<SchemaTargetType, string> = {
  Organization: 'helps search engines identify your business as an entity (name, logo, contact points).',
  LocalBusiness: 'is the single most valuable schema type for a local business — it can power rich results like your address, hours, and rating directly in search.',
  Product: 'helps search engines show product-specific rich results (price, availability) for something you sell.',
  Service: 'describes a specific service you offer, distinct from a physical product.',
  FAQPage: 'can make your frequently-asked questions appear directly, expandably, in Google search results.',
  BreadcrumbList: "shows your site's navigation path (e.g. Home > Services > Haircuts) directly in the search result.",
  WebSite: "identifies your site as a whole, and can enable Google's sitelinks search box.",
  WebPage: 'is the most generic page-level type — rarely essential on its own.',
}

/** Local businesses get real value from these two specifically; the rest are more situational, so their absence reads as 'info' rather than 'warning'. */
const HIGH_VALUE_TYPES: SchemaTargetType[] = ['LocalBusiness', 'Organization']

export function buildSchemaFindings(evidence: SchemaEvidence): Finding[] {
  const findings: Finding[] = []

  findings.push({
    id: 'schema-overview',
    category: 'schema',
    severity: evidence.scriptCount === 0 ? 'warning' : 'good',
    title: 'Structured data (JSON-LD)',
    whatWeFound: evidence.scriptCount === 0 ? 'Your homepage has no structured data (JSON-LD) at all.' : `Your homepage has ${evidence.scriptCount} structured data block${evidence.scriptCount > 1 ? 's' : ''}.`,
    whyItMatters: 'Structured data is what lets search engines show richer results for your business — star ratings, hours, FAQs — instead of a plain blue link.',
    recommendedAction: evidence.scriptCount === 0 ? 'See the checks below for which specific schema types are worth adding first.' : 'See the checks below for how complete each detected type is.',
    evidence: { scriptCount: evidence.scriptCount },
    confidence: 'verified',
    status: evidence.scriptCount === 0 ? 'NOT_FOUND' : 'FOUND',
  })

  if (evidence.hasParseError) {
    findings.push({
      id: 'schema-parse-error',
      category: 'schema',
      severity: 'warning',
      title: 'Structured data with invalid JSON',
      whatWeFound: 'At least one of your structured data blocks contains text that is not valid JSON, so it could not be read at all.',
      whyItMatters: 'A search engine encountering invalid JSON in a structured data block typically ignores that entire block — it gets none of the benefit, silently.',
      recommendedAction: 'Check your structured data with a JSON validator and fix the syntax error (a common cause is a trailing comma or an unescaped quote).',
      evidence: {},
      confidence: 'verified',
      status: 'POTENTIALLY_INVALID',
    })
  }

  for (const type of TARGET_TYPES) {
    const result = evidence.detected[type]
    const isHighValue = HIGH_VALUE_TYPES.includes(type)

    if (!result) {
      findings.push({
        id: `schema-${type.toLowerCase()}`,
        category: 'schema',
        severity: isHighValue ? 'warning' : 'info',
        title: `${type} schema`,
        whatWeFound: `No ${type} structured data was found.`,
        whyItMatters: `${type} schema ${TYPE_EXPLAINER[type]}`,
        recommendedAction: isHighValue ? `Adding ${type} structured data is one of the higher-value, low-effort SEO improvements available to a local business.` : `Only add ${type} schema if it genuinely applies to this page.`,
        evidence: {},
        confidence: 'verified',
        status: 'NOT_FOUND',
      })
      continue
    }

    findings.push({
      id: `schema-${type.toLowerCase()}`,
      category: 'schema',
      severity: result.status === 'PARSED' ? 'good' : 'warning',
      title: `${type} schema`,
      whatWeFound:
        result.status === 'PARSED'
          ? `${type} structured data was found and includes the properties a real result would need.`
          : `${type} structured data was found, but is missing: ${result.missingProperties.join(', ')}.`,
      whyItMatters: `${type} schema ${TYPE_EXPLAINER[type]}`,
      recommendedAction: result.status === 'PARSED' ? 'Nothing to do here.' : `Add the missing propert${result.missingProperties.length > 1 ? 'ies' : 'y'} (${result.missingProperties.join(', ')}) to this schema block.`,
      evidence: { missingProperties: result.missingProperties },
      confidence: 'verified',
      status: result.status,
    })
  }

  return findings
}
