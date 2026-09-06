import type { ToolCategory, ToolCtaDefinition, ToolDataSource, ToolDefinition, ToolFaqItem, ToolSecurityPolicy } from '@/lib/tools/types'
import type { FindingCategory } from './types'
import { runWebsiteAnalyzerTool } from './actions'

/**
 * Deliberately NOT imported from lib/constants.ts (which is where the
 * real AUDIT_HREF/AUDIT_CTA_LABEL live, and where they must keep
 * matching) — lib/constants.ts is going to import WEBSITE_ANALYZER_TOOLS
 * from this file to populate its own `TOOLS` array, so importing back
 * from lib/constants.ts here would create a circular module dependency.
 * Because AUDIT_HREF/AUDIT_CTA_LABEL are declared *after* `TOOLS` in
 * lib/constants.ts's own source order, that cycle wouldn't just be
 * inelegant — in a CommonJS-style circular require (what Next.js's
 * bundler produces), this module would see those bindings as still
 * `undefined` at the moment it evaluates (imports are resolved
 * top-to-bottom on first module load, not lazily), silently baking a
 * broken `href: undefined` into every CTA below. Inlined instead; if
 * lib/constants.ts's real values ever change, update both.
 */
const AUDIT_HREF = '/audit'
const AUDIT_CTA_LABEL = 'Get your free audit'

/**
 * The 12 focused `/tools/*` entries built on the Forge Website
 * Diagnostic engine (lib/website-analyzer/). Every one of them calls
 * the exact same analysis (lib/website-analyzer/analyzer.ts
 * analyzeWebsiteForCategories()) and just filters to its own category
 * (occasionally a finer id-prefix slice within one category) — no tool
 * below re-implements any parsing, fetching, or scoring logic. See
 * docs/tool-architecture.md for the engine this is built on and
 * docs/tools-cost-policy.md for why every one of them is FREE_INTERNAL.
 */

const SHARED_DATA_SOURCE: ToolDataSource = {
  id: 'homepage-fetch',
  name: 'The website you provide',
  costClassification: 'FREE_INTERNAL',
  description: 'We fetch your homepage directly (and, where relevant, /robots.txt and /sitemap.xml) using our own logic and the standard fetch API — no third-party SEO/data provider, no API key, no vendor.',
  requiresApiKey: false,
}

const SHARED_SECURITY_POLICY: ToolSecurityPolicy = {
  acceptsUserSuppliedUrl: true,
  ssrfMitigation: 'Every fetch goes through lib/tools/security.ts safeFetch()/validateUrlForFetch() — scheme/hostname/DNS-resolution checks against private/loopback/link-local/cloud-metadata ranges, a manual redirect loop that re-validates every hop, a hard timeout, a response-size cap, and Content-Type validation. Full detail: docs/tool-security.md.',
  rateLimitPerIp: '10 requests / 10 min / IP-ish key (server-only, in-memory — lib/rate-limit.ts)',
  inputValidation: "The submitted URL is normalized/validated client-safely (lib/validation.ts normalizeUrl()) before submission, then re-validated server-side against the full SSRF policy before any request is made — a client-side check is never trusted alone.",
  dataRetention: 'The analysis result is cached for up to 6 hours, file-backed, keyed by a hash of the submitted URL (lib/website-analyzer/analyzer.ts) — purely to avoid re-fetching the same site repeatedly. No lead or contact data is collected by these tools themselves.',
}

const SHARED_FAQ: ToolFaqItem[] = [
  {
    question: 'Does this check my whole site, or just my homepage?',
    answer: 'Just your homepage, on purpose — that keeps results fast and every finding traceable to something we actually fetched, rather than an unbounded crawl of your whole site.',
  },
  {
    question: 'Do you store the URL I submit?',
    answer: "We cache the result for up to 6 hours so re-checking the same site is instant, but we don't collect it as a lead or contact record — nothing is added to a mailing list.",
  },
]

const URL_INPUT_FIELD = {
  id: 'url',
  label: 'Website URL',
  type: 'url' as const,
  required: true,
  maxLength: 2048,
  placeholder: 'https://yourbusiness.com',
  helpText: "We'll check your site's homepage — this usually takes a few seconds.",
}

interface AnalyzerToolConfig {
  slug: string
  name: string
  shortDescription: string
  description: string
  category: ToolCategory
  intent: string
  categories: FindingCategory[]
  idPrefixes?: string[]
  primaryCTA: ToolCtaDefinition
  secondaryCTA?: ToolCtaDefinition
  relatedTools: string[]
  seoTitle: string
  seoDescription: string
  methodologyIntro: string
}

function makeAnalyzerTool(config: AnalyzerToolConfig): ToolDefinition {
  return {
    slug: config.slug,
    name: config.name,
    shortDescription: config.shortDescription,
    description: config.description,
    category: config.category,
    intent: config.intent,
    inputType: 'url',
    inputFields: [URL_INPUT_FIELD],
    // A bound Server Action reference, not a wrapping arrow function —
    // see runWebsiteAnalyzerTool's own doc comment (lib/website-analyzer/actions.ts)
    // for why that distinction matters for RSC serialization.
    run: runWebsiteAnalyzerTool.bind(null, config.slug, config.categories, config.idPrefixes),
    status: 'available',
    availability: 'free',
    costProfile: { classification: 'FREE_INTERNAL', monthlyCostEstimateUsd: 0, notes: 'Own logic against the URL the visitor supplies — no vendor, no key. See docs/tools-cost-policy.md §B category 2.' },
    dataSources: [SHARED_DATA_SOURCE],
    capabilities: [{ id: `${config.slug}-check`, label: config.name, description: config.intent, dataSource: SHARED_DATA_SOURCE }],
    securityPolicy: SHARED_SECURITY_POLICY,
    seo: { title: config.seoTitle, description: config.seoDescription },
    relatedTools: config.relatedTools,
    primaryCTA: config.primaryCTA,
    secondaryCTA: config.secondaryCTA,
    faq: SHARED_FAQ,
    methodology: `${config.methodologyIntro} We fetch your homepage directly — never Google Search or Google Maps — analyze the HTML and response ourselves, and never invent a fact we can't actually check. Where something is estimated rather than directly confirmed, it's labeled that way.`,
  }
}

const auditCTA = (headline: string, description: string): ToolCtaDefinition => ({ headline, description, label: AUDIT_CTA_LABEL, href: AUDIT_HREF, location: 'website-analyzer' })
const websitesCTA = (headline: string, description: string): ToolCtaDefinition => ({ headline, description, label: 'See Forge websites', href: '/websites', location: 'website-analyzer' })

export const WEBSITE_ANALYZER_TOOLS: ToolDefinition[] = [
  makeAnalyzerTool({
    slug: 'website-seo-audit',
    name: 'Website SEO Audit',
    shortDescription: 'A full, free check of your homepage’s on-page SEO — metadata, headings, schema, links, images, and content.',
    description: 'Checks the SEO fundamentals search engines actually look at: your title and meta description, heading structure, structured data, links, images, robots.txt, sitemap, and page content.',
    category: 'seo',
    intent: 'See what would actually move the needle on your homepage’s SEO — in plain language, not a jargon-filled report.',
    categories: ['metadata', 'headings', 'schema', 'links', 'images', 'content', 'robots', 'sitemap'],
    primaryCTA: auditCTA('See what we would fix first', "This audit checks your homepage's on-page SEO. The free Forge audit goes further — your full Google Business Profile and website together."),
    secondaryCTA: websitesCTA('Or see what a real Forge website includes', 'Every Forge website ships with the SEO fundamentals already handled.'),
    relatedTools: ['meta-checker', 'schema-checker', 'local-seo-checker'],
    seoTitle: 'Free Website SEO Audit',
    seoDescription: 'Check your homepage\'s title, meta description, headings, structured data, links, and images — free, instant, no signup.',
    methodologyIntro: 'This audit combines several checks across your homepage\'s metadata, heading structure, structured data, links, images, and visible content.',
  }),

  makeAnalyzerTool({
    slug: 'website-health-check',
    name: 'Website Health Check',
    shortDescription: 'The complete picture — every check this engine runs, on one page.',
    description: 'The most comprehensive check available: HTTP response, metadata, headings, links, images, structured data, robots.txt, sitemap, security headers, mobile-friendliness, business signals, content, and social links.',
    category: 'technical',
    intent: 'Get the complete, unfiltered picture of your homepage in one pass, before deciding what to fix first.',
    categories: ['http', 'metadata', 'headings', 'links', 'images', 'schema', 'robots', 'sitemap', 'security-headers', 'mobile', 'local-signals', 'content', 'social'],
    primaryCTA: auditCTA('Want a professional walkthrough of these results?', 'This check covers everything our engine can see. The free Forge audit adds a human review on top.'),
    secondaryCTA: websitesCTA('Turn these findings into a better website', 'See the Forge website tiers built to fix exactly these kinds of gaps.'),
    relatedTools: ['website-seo-audit', 'mobile-website-check', 'local-seo-checker'],
    seoTitle: 'Free Website Health Check',
    seoDescription: 'One free, comprehensive check of your homepage — SEO, mobile-friendliness, security headers, structured data, and more.',
    methodologyIntro: 'This is every check this engine runs, combined into one report.',
  }),

  makeAnalyzerTool({
    slug: 'mobile-website-check',
    name: 'Mobile Website Check',
    shortDescription: 'See how your homepage holds up on a phone — viewport, fixed-width layout signals, responsive images and CSS.',
    description: 'Checks for a mobile viewport tag, fixed-width layout signals that break on small screens, responsive image markup, and responsive CSS — most local search traffic happens on a phone.',
    category: 'performance',
    intent: 'Find out whether your homepage actually works well on the device most of your customers are using.',
    categories: ['mobile'],
    primaryCTA: websitesCTA('Turn these findings into a better website', 'Every Forge website is built mobile-first from the ground up.'),
    secondaryCTA: auditCTA('Or get the full free audit', 'See mobile-friendliness alongside every other check on your homepage and Google profile.'),
    relatedTools: ['website-health-check', 'image-seo-checker'],
    seoTitle: 'Free Mobile Website Check',
    seoDescription: 'Check whether your homepage is genuinely mobile-friendly — viewport tag, fixed-width signals, responsive images and CSS.',
    methodologyIntro: 'This check looks for mobile-friendliness signals in your homepage\'s own markup and CSS.',
  }),

  makeAnalyzerTool({
    slug: 'schema-checker',
    name: 'Schema Markup Checker',
    shortDescription: 'See which structured data (JSON-LD) types your homepage has — and which ones are worth adding.',
    description: 'Checks for Organization, LocalBusiness, Product, Service, FAQPage, BreadcrumbList, WebSite, and WebPage structured data — distinguishing found, parsed, and potentially incomplete, never claiming full spec validity.',
    category: 'seo',
    intent: 'Find out whether your homepage gives search engines the structured facts they need for rich results.',
    categories: ['schema'],
    primaryCTA: auditCTA('Want us to add this for you?', 'Structured data is one of the specific things Forge sets up on every website we build.'),
    relatedTools: ['website-seo-audit', 'meta-checker'],
    seoTitle: 'Free Schema Markup Checker',
    seoDescription: 'Check your homepage for LocalBusiness, Organization, Product, FAQPage, and other JSON-LD structured data — free, instant.',
    methodologyIntro: 'This checks for JSON-LD structured data blocks, whether they parse as valid JSON, and whether they include the properties a real result would need.',
  }),

  makeAnalyzerTool({
    slug: 'meta-checker',
    name: 'Meta Tags Checker',
    shortDescription: 'Title, meta description, canonical, viewport, charset, language, and robots meta — all in one check.',
    description: 'Checks the core HTML metadata tags search engines and browsers rely on: title, meta description, canonical link, viewport, charset, declared language, and robots meta.',
    category: 'seo',
    intent: 'Make sure the basic tags every page should have are actually there — and sized right.',
    categories: ['metadata'],
    idPrefixes: ['meta-title', 'meta-description', 'meta-canonical', 'meta-viewport', 'meta-charset', 'meta-language', 'meta-robots'],
    primaryCTA: auditCTA('Want your metadata fixed?', 'This is one of the fastest, highest-leverage fixes on a website.'),
    relatedTools: ['open-graph-checker', 'schema-checker'],
    seoTitle: 'Free Meta Tags Checker',
    seoDescription: "Check your homepage's title, meta description, canonical tag, viewport, charset, and language — free, instant.",
    methodologyIntro: "This checks the core meta tags in your homepage's HTML head.",
  }),

  makeAnalyzerTool({
    slug: 'open-graph-checker',
    name: 'Open Graph & Twitter Card Checker',
    shortDescription: 'See exactly how your homepage looks when shared on Facebook, WhatsApp, LinkedIn, or X.',
    description: 'Checks your Open Graph tags (og:title, og:description, og:image, og:type) and Twitter/X card tags — what actually controls the preview when someone shares your link.',
    category: 'content',
    intent: 'Make sure a shared link to your site looks intentional, not like a broken preview with no image.',
    categories: ['metadata'],
    idPrefixes: ['meta-open-graph', 'meta-twitter'],
    primaryCTA: auditCTA('Want your links to look right when shared?', "A missing share preview is a small, easy-to-miss detail Forge checks on every site."),
    relatedTools: ['meta-checker', 'local-seo-checker'],
    seoTitle: 'Free Open Graph & Twitter Card Checker',
    seoDescription: 'Check how your homepage looks when shared on Facebook, WhatsApp, LinkedIn, or X — Open Graph and Twitter card tags.',
    methodologyIntro: "This checks the Open Graph and Twitter/X card tags in your homepage's HTML head.",
  }),

  makeAnalyzerTool({
    slug: 'robots-txt-checker',
    name: 'Robots.txt Checker',
    shortDescription: 'Check whether your robots.txt exists, loads correctly, and declares your sitemap.',
    description: 'Fetches /robots.txt directly and checks that it exists, loads, follows recognizable syntax, and declares a sitemap — never crawls anything it references.',
    category: 'technical',
    intent: 'Make sure search engines can read your crawling rules the way you intend.',
    categories: ['robots'],
    primaryCTA: auditCTA('Want this set up correctly?', 'A misconfigured robots.txt can accidentally block search engines from your whole site.'),
    relatedTools: ['sitemap-checker', 'website-health-check'],
    seoTitle: 'Free Robots.txt Checker',
    seoDescription: 'Check whether your robots.txt file exists, loads correctly, and declares your sitemap — free, instant.',
    methodologyIntro: 'This fetches your /robots.txt directly and checks its syntax and sitemap declaration.',
  }),

  makeAnalyzerTool({
    slug: 'sitemap-checker',
    name: 'Sitemap Checker',
    shortDescription: 'Check whether your sitemap.xml exists, loads, and lists your pages.',
    description: 'Fetches /sitemap.xml directly and checks that it exists, loads as valid XML, and reports how many pages (or child sitemaps) it lists — never recursively fetches a sitemap index\'s children.',
    category: 'technical',
    intent: 'Make sure search engines have a direct, complete list of your pages to discover.',
    categories: ['sitemap'],
    primaryCTA: auditCTA('Want a sitemap that actually works?', "A missing or broken sitemap makes it harder for search engines to find your pages."),
    relatedTools: ['robots-txt-checker', 'website-health-check'],
    seoTitle: 'Free Sitemap Checker',
    seoDescription: 'Check whether your sitemap.xml exists, loads correctly, and lists your pages — free, instant.',
    methodologyIntro: 'This fetches your /sitemap.xml directly and checks that it loads and parses as valid XML.',
  }),

  makeAnalyzerTool({
    slug: 'link-checker',
    name: 'Link Checker',
    shortDescription: 'Count your internal/external links, catch empty or malformed ones, and test a sample of internal links for real.',
    description: 'Counts internal vs. external links, flags empty or malformed href attributes, and actually checks a small sample of internal links for a real, live response — bounded, not a full site crawl.',
    category: 'technical',
    intent: 'Catch the obvious broken or malformed links on your homepage before a customer does.',
    categories: ['links'],
    primaryCTA: auditCTA('Want these fixed for you?', 'A broken link on a homepage is a small thing that quietly erodes trust.'),
    relatedTools: ['website-health-check', 'website-seo-audit'],
    seoTitle: 'Free Link Checker',
    seoDescription: 'Check your homepage for broken, empty, or malformed links — free, instant, checks a real sample of internal links.',
    methodologyIntro: "This checks every link on your homepage's markup, and actually tests a small sample of your internal links for a real response.",
  }),

  makeAnalyzerTool({
    slug: 'image-seo-checker',
    name: 'Image SEO Checker',
    shortDescription: 'Alt text, declared dimensions, lazy loading, and possibly oversized images — all in one check.',
    description: 'Checks every image on your homepage for alt text, declared width/height, lazy-loading, and markup signals of a possibly oversized, unoptimized file.',
    category: 'seo',
    intent: 'Find the specific images worth fixing for both accessibility and page speed.',
    categories: ['images'],
    primaryCTA: auditCTA('Want faster, better-optimized images?', 'Image optimization is one of the most common, highest-impact fixes on a website.'),
    relatedTools: ['mobile-website-check', 'website-health-check'],
    seoTitle: 'Free Image SEO Checker',
    seoDescription: "Check your homepage's images for missing alt text, missing dimensions, lazy loading, and oversized-file signals.",
    methodologyIntro: "This checks every `<img>` tag in your homepage's markup.",
  }),

  makeAnalyzerTool({
    slug: 'security-headers-checker',
    name: 'Security Headers Checker',
    shortDescription: 'Check for HSTS, CSP, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy — each reported independently.',
    description: 'Checks your homepage\'s response for five useful security headers, each reported on its own — never a single rolled-up "insecure" verdict from one missing header.',
    category: 'technical',
    intent: 'See which real, low-effort security headers your site is missing.',
    categories: ['security-headers'],
    primaryCTA: auditCTA('Want your site properly secured?', "Most of these headers are a genuinely quick fix once you know they're missing."),
    relatedTools: ['website-health-check'],
    seoTitle: 'Free Security Headers Checker',
    seoDescription: 'Check your website for HSTS, Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers.',
    methodologyIntro: "This checks your homepage's own HTTP response headers directly — nothing about your server's actual configuration beyond what it sends.",
  }),

  makeAnalyzerTool({
    slug: 'local-seo-checker',
    name: 'Local SEO Checker',
    shortDescription: 'Phone, address, hours, WhatsApp/Maps links, and service descriptions — the business signals that make a local site findable and trustworthy.',
    description: 'Checks your homepage for the business-identity signals that matter most to a local business: phone number, address, service area, opening hours, contact call-to-action, WhatsApp and Google Maps links, service descriptions, and social profile links.',
    category: 'local-seo',
    intent: 'See whether your homepage actually makes it easy for a nearby customer to find and contact you.',
    categories: ['local-signals', 'social'],
    primaryCTA: auditCTA('Get the complete business visibility audit', "This check looks at your homepage. The free Forge audit also reviews your Google Business Profile — the two work together."),
    relatedTools: ['website-seo-audit', 'website-health-check'],
    seoTitle: 'Free Local SEO Checker',
    seoDescription: "Check your homepage for the business signals that matter most locally — phone, address, hours, WhatsApp and Maps links.",
    methodologyIntro: 'This checks your homepage\'s own text and links for local-business signals — never your actual Google Business Profile, which this tool has no access to.',
  }),
]
