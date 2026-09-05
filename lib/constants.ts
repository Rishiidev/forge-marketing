/**
 * Central business data for Forge's marketing site.
 *
 * This is the single source of truth for pricing, tiers, plans, and
 * contact info referenced anywhere in the app. Do not hard-code any of
 * these values in a component — import from here instead.
 *
 * Every value is sourced from docs/forge-business-rules.md, which was in
 * turn extracted from the legacy/ codebase. Where that document marks
 * something TBD, it is marked TBD here too (status/`null` fields) rather
 * than guessed at. See docs/forge-business-rules.md → "HUMAN DECISIONS
 * REQUIRED" for the open items referenced throughout this file.
 */

export const SITE = {
  name: 'Forge',
  tagline: 'Forging professional online presence for local businesses.',
  marketingUrl: 'https://forge.bruuhh.com',
  // The customer application is a separate, not-yet-built surface.
  // See docs/architecture.md.
  appUrl: 'https://app.forge.bruuhh.com',
  // TBD — docs/forge-business-rules.md, Human Decision #13. The legacy
  // codebase ships two different, mutually inconsistent values
  // (hello@forge.local, which does not resolve, and
  // hello@forge.bruuhh.com). Do not treat either as confirmed.
  supportEmail: null as string | null,
  // TBD — same decision as above. Every legacy page ships the literal
  // placeholder '919999999999'. Do not reuse that value as if real.
  whatsappNumber: null as string | null,
} as const

// ---------------------------------------------------------------------
// Website tiers (/websites, /websites/5000, /websites/15000, /websites/25000)
// ---------------------------------------------------------------------

export type WebsiteTierSlug = '5000' | '15000' | '25000'

export interface WebsiteTier {
  slug: WebsiteTierSlug
  /** Short product-line name (Launch / Growth / Pro) — the primary label on the pricing ladder. */
  name: string
  /** Price in INR, or null when the price itself is unconfirmed. */
  price: number | null
  priceLabel: string
  tagline: string
  deliveryTime: string
  revisionPolicy: string
  included: string[]
  excluded: string[]
  /** 'confirmed' = documented in the legacy codebase as shipped. 'tbd' = gap or conflict; see sourceNote. */
  status: 'confirmed' | 'tbd'
  sourceNote: string
}

export const WEBSITE_TIERS: WebsiteTier[] = [
  {
    slug: '5000',
    name: 'Launch',
    price: 5000,
    priceLabel: '₹5,000',
    tagline:
      'A complete, professional website — live in about 45 minutes, built from your Google Business Profile. Intentionally simple: you see it live and approve it before paying anything, so there is nothing to revise.',
    deliveryTime: '~45 minutes',
    revisionPolicy: 'None needed — you see the finished site before you pay, not after.',
    included: [
      'Real website built from your Google Business Profile',
      'Mobile-first, Google-Maps-ready layout',
      'WhatsApp and Call buttons on every page',
      'Custom domain registered in your name',
      'Business email setup',
      'A Cloudflare account created and shared with you',
      'Google Business Profile linking and optimization',
      'Live preview before any payment',
      '14-day bug support after launch',
    ],
    excluded: [
      'Custom design from scratch',
      'Custom copywriting beyond your Google Business Profile',
      'Revisions to template layout or copy',
      'Logo design',
      'Booking system, payment gateway, or CRM',
    ],
    status: 'confirmed',
    sourceNote: 'legacy/5000-setup.html — docs/forge-business-rules.md §6',
  },
  {
    slug: '15000',
    name: 'Growth',
    price: 15000,
    priceLabel: '₹15,000',
    tagline: 'Everything in the ₹5,000 tier, plus a custom design built specifically for your business.',
    deliveryTime: 'TBD — not stated in the source codebase',
    revisionPolicy: 'TBD — not stated in the source codebase',
    included: [
      'Everything in the ₹5,000 Website',
      'Custom design from scratch',
      'Custom copywriting',
      'Your logo',
      'Custom palette and font pair',
    ],
    excluded: [],
    status: 'confirmed',
    sourceNote: 'legacy/5000-setup.html upsell ladder, Tier 2 "Custom Site" — docs/forge-business-rules.md §7',
  },
  {
    slug: '25000',
    name: 'Pro',
    price: null,
    priceLabel: '₹25,000 — pending confirmation',
    tagline:
      'PLACEHOLDER. No ₹25,000 product exists in the source codebase. The two nearest real tiers are ₹24,999 ("Made-For-You Website") and ₹30,000 ("Custom + Active"). Do not present this tier as final until Human Decision #2 is resolved.',
    deliveryTime: 'TBD',
    revisionPolicy: 'TBD',
    included: [],
    excluded: [],
    status: 'tbd',
    sourceNote: 'No direct source. See docs/forge-business-rules.md §8 and "HUMAN DECISIONS REQUIRED" #2.',
  },
]

export function getWebsiteTier(slug: string): WebsiteTier | undefined {
  return WEBSITE_TIERS.find((tier) => tier.slug === slug)
}

// ---------------------------------------------------------------------
// Maintenance plan (/maintenance)
// ---------------------------------------------------------------------

export interface MaintenancePlan {
  id: string
  name: string
  priceLabel: string
  tagline: string
  included: string[]
  featured?: boolean
}

/**
 * The three-tier structure from legacy/operator.html — the more fully
 * specified of the two conflicting maintenance-pricing structures found
 * in the legacy codebase (the other is a flat ₹1,999/mo mention in
 * legacy/5000-setup.html). See docs/forge-business-rules.md §9 and
 * Human Decision #3 — this has not been confirmed as final.
 */
export const MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    id: 'steady',
    name: 'Steady',
    priceLabel: '₹1,499 / month',
    tagline: 'For businesses with a stable offer and a website that does not change often.',
    included: [
      'Hosting, SSL, backups, uptime monitoring',
      'One small content update per month',
      '14-day bug support included',
      'Monthly quiet check-in email',
    ],
  },
  {
    id: 'active',
    name: 'Active',
    priceLabel: '₹3,999 / month',
    tagline: 'For businesses that change services, photos, prices, or hours every month or two.',
    included: [
      'Everything in Steady',
      'Up to three content or photo updates per month',
      'Quarterly seven-point audit re-review',
      'Two small design updates per quarter',
      '48-hour response on any issue',
    ],
    featured: true,
  },
  {
    id: 'forged',
    name: 'Forged',
    priceLabel: '₹7,999 / month',
    tagline: 'For businesses building a serious online presence and want the next layers.',
    included: [
      'Everything in Active',
      'Monthly content and photo updates',
      'Reviews and SEO layer, when launched',
      'Priority access to the Bookings and CRM layer',
      'Direct line to Forge, no shared inbox',
    ],
  },
]

export const MAINTENANCE_CLIENT_CAP = 8

// ---------------------------------------------------------------------
// Capacity strip — the "single source of truth" cap mechanism, carried
// forward from legacy/index.html. Update these numbers monthly; every
// component that renders capacity should read from here, never hard-code
// a number.
// ---------------------------------------------------------------------

export interface CapacityConfig {
  total: number
  remaining: number
  nextReset: string
  waitlistSize: number
  /**
   * 'confirmed' = these are real, currently-accurate numbers safe to show.
   * 'tbd' = mechanism is real (legacy/README.md: "real monthly launch cap,
   * 6 websites per month") but the CURRENT period's numbers aren't set.
   * components/conversion/CapacityStrip.tsx renders nothing when this is
   * 'tbd' — per docs/conversion-architecture.md: "If the cap isn't real
   * for this launch, do not display urgency here at all."
   */
  status: 'confirmed' | 'tbd'
}

export const CAPACITY: CapacityConfig = {
  total: 6,
  remaining: 6,
  nextReset: 'TBD — set the real reset date before launch',
  waitlistSize: 12,
  status: 'tbd',
}

// ---------------------------------------------------------------------
// Industry templates — from forge-icp-and-templates.md (legacy/), kept
// here as structured data instead of prose so showcase/tool pages can
// reuse it.
// ---------------------------------------------------------------------

export interface IndustryTemplate {
  id: string
  label: string
  icpMatch: string
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  { id: 'salon', label: 'Salon & Beauty', icpMatch: 'ICP-1' },
  { id: 'clinic', label: 'Clinic & Medical', icpMatch: 'ICP-1' },
  { id: 'cafe', label: 'Café & Restaurant', icpMatch: 'ICP-2' },
  { id: 'studio', label: 'Studio (yoga, photography, art, music)', icpMatch: 'ICP-2' },
  { id: 'service', label: 'Service (plumber, electrician, AC repair, mechanic)', icpMatch: 'ICP-4' },
  { id: 'coach', label: 'Coach / Tutor / Consultant', icpMatch: 'ICP-3' },
]

// ---------------------------------------------------------------------
// Tools (/tools, /tools/[slug]) — no interactive tool currently exists
// in the source codebase beyond the bespoke pricing calculator
// (legacy/bespoke-quote.html), which this registry does not yet model.
// This is a placeholder registry, not a migrated feature.
// ---------------------------------------------------------------------

export interface ToolDefinition {
  slug: string
  name: string
  description: string
  status: 'planned'
}

export const TOOLS: ToolDefinition[] = []

// ---------------------------------------------------------------------
// Primary navigation — reflects the new route structure, not the legacy
// per-page nav links (which varied per page).
// ---------------------------------------------------------------------

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/websites', label: 'Websites' },
  { href: '/maintenance', label: 'Maintenance' },
  { href: '/showcases', label: 'Showcases' },
  { href: '/tools', label: 'Tools' },
  { href: '/blog', label: 'Blog' },
] as const

export const AUDIT_HREF = '/audit'

/**
 * The one label every "go take the free audit" CTA uses, site-wide.
 * docs/conversion-architecture.md: "Use CTA language consistently." The
 * audit form's own submit button ("Send my free audit") is a distinct
 * micro-moment (submitting vs. navigating) and is not required to match.
 */
export const AUDIT_CTA_LABEL = 'Get your free audit'

/**
 * The business-category options used on the legacy audit/waitlist forms
 * (legacy/audit.html, legacy/index.html waitlist form) — reused verbatim
 * as existing, working content rather than replaced with the narrower
 * six-item INDUSTRY_TEMPLATES list above, which serves a different
 * purpose (website template selection, not lead categorization).
 */
export const CATEGORY_OPTIONS = [
  'Salon or spa',
  'Clinic or dental',
  'Cafe or restaurant',
  'Design or architecture studio',
  'Real estate',
  'Hotel or guesthouse',
  'Tuition or coaching',
  'Service business',
  'Other',
] as const
