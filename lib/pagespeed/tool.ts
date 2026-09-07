import type { ToolDefinition } from '@/lib/tools/types'
import { runPageSpeedTool } from './actions'

/**
 * The registry entry for the Forge PageSpeed Test — kept for the same
 * reason every lib/website-analyzer/tools.ts entry is registered
 * (relatedTools cross-links, /tools index card, sitemap inclusion,
 * lib/tools/__tests__/cost-policy.test.ts validation) even though the
 * real, richer UX lives at the static route
 * app/tools/page-speed-test/page.tsx (which Next.js resolves in
 * preference to the generic `/tools/[slug]` for this exact slug) rather
 * than through components/tools/ToolPageShell.tsx. `run` still points
 * at a fully working generic-engine-compatible entry point
 * (lib/pagespeed/actions.ts runPageSpeedTool) so this declaration is
 * never a stub.
 */
export const PAGESPEED_TOOL: ToolDefinition = {
  slug: 'page-speed-test',
  name: 'PageSpeed Test',
  shortDescription: 'Real Core Web Vitals from Google, plus your title, meta, schema, and mobile signals — one free check.',
  description:
    'Runs a real Google PageSpeed Insights check (performance, accessibility, best practices, and Core Web Vitals) alongside the Forge Website Diagnostic Engine\'s own SEO/technical checks — one report, mobile-focused, with what to fix first.',
  category: 'performance',
  intent: 'Find out how fast your site actually is for a real visitor, and exactly what to fix first.',
  inputType: 'url',
  inputFields: [
    {
      id: 'url',
      label: 'Website URL',
      type: 'url',
      required: true,
      maxLength: 2048,
      placeholder: 'https://yourbusiness.com',
      helpText: 'We\'ll run a real PageSpeed check on your mobile homepage — this can take up to 20-25 seconds.',
    },
  ],
  run: runPageSpeedTool,
  status: 'available',
  availability: 'external-free-api',
  costProfile: {
    classification: 'FREE_EXTERNAL_API',
    monthlyCostEstimateUsd: 'variable-free-tier-only',
    notes:
      'Google\'s PageSpeed Insights API v5 has no paid tier — Google does not charge for calls to this specific API. An API key is optional per Google\'s own docs but required by this tool\'s design (see lib/pagespeed/google-provider.ts) to avoid the unauthenticated endpoint\'s low, shared quota. No key is set in this repository/deployment by default, so this tool runs entirely on the internal Website Diagnostic Engine until a human sets PSI_API_KEY outside this repo. See docs/tools.md "PageSpeedProvider" for the full quota/cost/limitations citation.',
  },
  dataSources: [
    {
      id: 'google-pagespeed-insights',
      name: 'Google PageSpeed Insights API v5',
      costClassification: 'FREE_EXTERNAL_API',
      description: 'Real Lighthouse lab run + Chrome UX Report (CrUX) real-user field data, when Google has enough traffic to report it. Optional — this tool works without it (see dataOrigin: "unavailable" handling in lib/pagespeed/findings.ts).',
      requiresApiKey: true,
      apiKeyEnvVar: 'PSI_API_KEY',
      officialDocsUrl: 'https://developers.google.com/speed/docs/insights/v5/get-started',
      rateLimitNotes: 'No documented daily/per-100-second quota number on Google\'s current docs pages (verified 2026-09-07) — Google Cloud Console assigns a per-project default only after a key exists. Forge rate-limits its own usage independently (5 requests / 10 min / IP-ish key) regardless of whatever Google\'s real limit turns out to be.',
    },
    {
      id: 'internal-website-analyzer',
      name: 'Forge Website Diagnostic Engine',
      costClassification: 'FREE_INTERNAL',
      description: 'title/meta/viewport/schema/headings/HTTPS/image/mobile checks, reused as-is from lib/website-analyzer/ — never re-implemented here.',
      requiresApiKey: false,
    },
  ],
  capabilities: [
    { id: 'pagespeed-core-web-vitals', label: 'Core Web Vitals', description: 'LCP, CLS, INP, FCP, TTFB — real-user (field) data when available, lab data otherwise, clearly labeled either way.', dataSource: { id: 'google-pagespeed-insights', name: 'Google PageSpeed Insights API v5', costClassification: 'FREE_EXTERNAL_API', description: 'Real Lighthouse + CrUX data.', requiresApiKey: true, apiKeyEnvVar: 'PSI_API_KEY' } },
    { id: 'pagespeed-technical-seo', label: 'SEO & technical checks', description: 'Title, meta, schema, headings, HTTPS, images, mobile signals — from the internal engine, always available.', dataSource: { id: 'internal-website-analyzer', name: 'Forge Website Diagnostic Engine', costClassification: 'FREE_INTERNAL', description: 'Own logic, no external call.', requiresApiKey: false } },
  ],
  securityPolicy: {
    acceptsUserSuppliedUrl: true,
    ssrfMitigation:
      'Google\'s own servers fetch the submitted URL for the PageSpeed check, not Forge\'s — the same lib/tools/security.ts validateUrlForFetch() check used everywhere else in this codebase is still applied before ever sending the URL to Google, both for consistency and to stop this endpoint being usable to point Google\'s crawler at an arbitrary internal address. The internal Website Diagnostic Engine half of this tool fetches the homepage directly and uses the full safeFetch() SSRF policy (docs/tool-security.md), same as every other website-analyzer tool.',
    rateLimitPerIp: '5 requests / 10 min / IP-ish key for the PageSpeed check (server-only, in-memory, lib/rate-limit.ts) — tighter than the other 12 tools\' 10/10min, since a real Lighthouse run is a slow, quota-metered Google operation.',
    inputValidation: 'The submitted URL is normalized/validated client-safely (lib/validation.ts normalizeUrl()) before submission, then re-validated server-side against the full SSRF policy before use.',
    dataRetention: 'PageSpeed results are cached for up to 12 hours, file-backed, keyed by a hash of the submitted URL and strategy (lib/pagespeed/cache.ts) — public data about a public URL, never keyed by visitor identity, session, or IP. No lead or contact data is collected by this tool.',
  },
  seo: {
    title: 'Free PageSpeed Test — Core Web Vitals & SEO Check',
    description: 'Real Google Core Web Vitals (LCP, CLS, INP) plus title, meta, schema, and mobile checks — free, one report, what to fix first.',
  },
  relatedTools: ['mobile-website-check', 'website-seo-audit', 'image-seo-checker'],
  primaryCTA: {
    headline: 'Turn these findings into a better website',
    description: 'Speed and SEO fixes are exactly what a Forge website is built around from day one.',
    label: 'See Forge websites',
    href: '/websites',
    location: 'pagespeed-test',
  },
  secondaryCTA: {
    headline: 'Or get the full free audit',
    description: 'See your site speed alongside your Google Business Profile and every other signal, in one review.',
    label: 'Get your free audit',
    href: '/audit',
    location: 'pagespeed-test',
  },
  faq: [
    {
      question: 'Does this cost anything, or use my Google account?',
      answer: 'No — it\'s free, and it never touches your Google account. It calls Google\'s own public PageSpeed Insights API to check your site the same way Google itself does.',
    },
    {
      question: 'Why don\'t I see real-user data for some metrics?',
      answer: "Google only reports real-user (field) data once a site gets enough Chrome traffic to measure reliably — for a newer or smaller site, we show lab (simulated) data instead, or say plainly when neither is available. We never invent a number to fill the gap.",
    },
    {
      question: 'Does a good score guarantee better Google rankings or more sales?',
      answer: "No — speed is one input search engines and visitors both care about, not a guarantee of ranking or sales. We won't tell you otherwise.",
    },
  ],
  methodology:
    "This checks your homepage on mobile — the device most local-business customers actually browse on. Performance, accessibility, and best-practices scores plus Core Web Vitals (LCP, CLS, INP, FCP, TTFB) come from a real Google PageSpeed Insights run when available; title, meta description, schema, headings, HTTPS, images, and mobile-friendliness come from Forge's own Website Diagnostic Engine, always, regardless of whether Google's data is available.",
}
