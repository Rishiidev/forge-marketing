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
  /** One line: who should pick this tier. Used on the comparison table and tier page. */
  bestFor: string
  /** Price in INR, or null when the price itself is unconfirmed. */
  price: number | null
  priceLabel: string
  tagline: string
  /** Fuller description of who this is (and isn't) for — rendered on the tier's own page. */
  whoItsFor: string
  deliveryTime: string
  revisionPolicy: string
  ownership: string
  support: string
  included: string[]
  excluded: string[]
  /** Ordered steps from first contact to launch. */
  process: string[]
  /** 'confirmed' = documented in the legacy codebase or set directly by the business owner. 'tbd' = gap or conflict; see sourceNote. */
  status: 'confirmed' | 'tbd'
  sourceNote: string
}

/**
 * Commercial ladder set directly by the business owner (session
 * 2026-09-06) — see docs/decisions.md ADR-011. This supersedes the
 * conflicting legacy price points (₹9,999/₹24,999 on index.html,
 * ₹30,000 on 5000-setup.html) and resolves forge-business-rules.md
 * Human Decisions #1 (canonical funnel) and #2 (the ₹25,000 figure) —
 * both marked resolved there, with this note as the citation. The three
 * tiers are scoped to be genuinely different levels of build complexity
 * and business value (build approach, revision structure, delivery time,
 * support window, whether a conversion engine is included) — not the
 * same product with items added to justify a higher number.
 */
export const WEBSITE_TIERS: WebsiteTier[] = [
  {
    slug: '5000',
    name: 'Launch',
    bestFor: "You don't have a website yet and want a real, working one live today.",
    price: 5000,
    priceLabel: '₹5,000',
    tagline:
      'A complete, professional website built from your Google Business Profile — live the same day. You see it live and approve it before paying anything, so there is nothing to revise before launch.',
    whoItsFor:
      "For businesses with no website at all, who need one to exist — professional, mobile-first, easy to find — without a design project. It is not for a business that needs a specific look, several distinct pages, or the ability to change the copy later; that is Growth, below.",
    deliveryTime: 'Live the same day — typically under 45 minutes to your first preview.',
    revisionPolicy:
      'None before launch — you review the finished, live site and only pay if you want it. Bug fixes are covered for 14 days after that; changes to layout or copy are a separate Growth-tier upgrade, not a revision on this plan.',
    ownership:
      'The domain is registered in your name from the start. Your Cloudflare login is created and handed to you. Once paid, the site, domain, and email are entirely yours — nothing is held back if you ever leave Forge.',
    support: '14 days of bug support after launch. No ongoing updates are included — see Maintenance for that.',
    included: [
      'Real website built directly from your Google Business Profile',
      'Mobile-first, Google-Maps-ready layout',
      'WhatsApp and Call buttons on every page',
      'Custom domain registered in your name',
      'Business email setup',
      'Free hosting, set up and handled for you (via Cloudflare) — nothing for you to configure',
      'Google Business Profile linking and optimization',
      'Live preview before any payment',
      '14-day bug support after launch',
    ],
    excluded: [
      'Custom design — every Launch site follows the same clean, proven layout',
      'Custom copywriting beyond what is already on your Google Business Profile',
      'Revisions to layout or copy',
      'Logo design or brand identity work',
      'Booking system, payment gateway, or CRM',
      'Any promise about rankings, leads, or revenue',
    ],
    process: [
      'Send your Google Business Profile link (about 2 minutes).',
      'Forge builds your site directly from it (about 30–45 minutes).',
      'You review the live site — nothing is charged yet.',
      'Approve and pay ₹5,000; domain, email, and logins are handed over the same day.',
    ],
    status: 'confirmed',
    sourceNote:
      'Scope carried forward from legacy/5000-setup.html (docs/forge-business-rules.md §6); commercial framing set by the business owner, docs/decisions.md ADR-011.',
  },
  {
    slug: '15000',
    name: 'Growth',
    bestFor: 'You already have some traction and need the site to look and read like your business, not a fast placeholder.',
    price: 15000,
    priceLabel: '₹15,000',
    tagline:
      'A custom-designed website, written for your business specifically — with one structured round to get it right before it launches.',
    whoItsFor:
      "For businesses past the 'just need something live' stage — the site should look distinctly like theirs, use their own words, and hold up as their main online presence. Not for a business that needs multiple service pages, a booking flow, or a built-in conversion engine; that is Pro.",
    deliveryTime: '2–4 days from kickoff to live, depending on the revision round.',
    revisionPolicy:
      'One structured revision round after the first preview — changes to the pages already agreed on, not a new direction or new pages. Anything beyond that is scoped and quoted separately, same as every tier.',
    ownership:
      'Same ownership guarantee as Launch: domain in your name, full files and logins handed over once the final payment clears.',
    support: '30 days of bug support after launch.',
    included: [
      'Everything in Launch — domain, email, GBP linking, live preview before payment',
      'Custom design built around your business, not a shared layout',
      'Up to 3 pages, split by purpose (e.g. home, services, contact) instead of one long page',
      'Copy written for your business, not lifted from your Google Business Profile',
      'Your logo placed and sized correctly across the site',
      'One structured revision round after preview',
      '30-day bug support after launch',
    ],
    excluded: [
      'Full brand identity work — logo creation from scratch, brand guidelines',
      'Unlimited or open-ended revisions',
      'Booking system, payment gateway, or CRM',
      'Ongoing updates after launch — see Maintenance',
    ],
    process: [
      'Short kickoff call or WhatsApp brief on your business and what the site should say (about 15 minutes).',
      'Forge designs and writes the site around that brief (2–3 days).',
      'You review the live preview and use your one revision round.',
      'Final review, domain and email handover, launch.',
    ],
    status: 'confirmed',
    sourceNote:
      'Scope and process defined directly by the business owner, session 2026-09-06 — see docs/decisions.md ADR-011. The prior legacy source (5000-setup.html Tier 2, "Custom Site") stated only a shorter feature list with no delivery time or revision policy; this fills that gap by explicit decision rather than leaving it TBD.',
  },
  {
    slug: '25000',
    name: 'Pro',
    bestFor: 'You have real volume — several services, a booking flow, or a story that needs more than a few pages.',
    price: 25000,
    priceLabel: '₹25,000',
    tagline:
      "Forge's premium build: fully custom design and copy, more pages, and a conversion engine built in — for a business that needs the site to actively help convert visitors, not just represent it.",
    whoItsFor:
      'For businesses with enough volume or complexity that a generic contact form is not enough — several services to explain, a booking flow to run, or a story that takes more than three pages to tell. Not for a business just getting a first website live; that is Launch.',
    deliveryTime: '5–7 days from kickoff to live.',
    revisionPolicy:
      'Two structured revision rounds, defined the same way as Growth — changes to the agreed pages and scope, not a new direction.',
    ownership: 'Same ownership guarantee as every tier: domain in your name, full files and logins handed over on final payment.',
    support:
      '60 days of bug support after launch, plus your first month of Active maintenance included at no extra cost, so nothing is unattended in the weeks right after launch.',
    included: [
      'Everything in Growth — custom design, custom copy, your logo, one revision round becomes two',
      'Up to 8 pages, scoped to your business',
      'One conversion engine of your choice — a service picker, a booking-request form, or a quote wizard — wired to WhatsApp or email, not a generic contact form',
      'Two structured revision rounds',
      'Priority delivery slot',
      '60-day bug support after launch',
      'First month of Active maintenance included',
    ],
    excluded: [
      'A full multi-year brand system or brand strategy engagement',
      'E-commerce or online payment processing',
      'Anything requiring a dedicated backend or database — a future Bookings/CRM layer, not part of this product',
    ],
    process: [
      'Kickoff call to map pages, content, and which conversion engine fits your business (about 30 minutes).',
      'Design and build (4–5 days).',
      'Preview, then two structured revision rounds.',
      'Launch, with your first month of Active maintenance already running.',
    ],
    status: 'confirmed',
    sourceNote:
      'Set directly by the business owner, session 2026-09-06 — resolves forge-business-rules.md Human Decision #2 (no ₹25,000 product previously existed at any price point; the nearest legacy figures were ₹24,999 and ₹30,000). See docs/decisions.md ADR-011.',
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
 * legacy/5000-setup.html). Prices and tier count unchanged — see
 * docs/forge-business-rules.md §9 and Human Decision #3, still open.
 * Taglines reframed (session 2026-09-06, docs/decisions.md ADR-011) to
 * read as ongoing technical care and improvement, not just hosting —
 * a positioning change only, not a scope or price change.
 */
export const MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    id: 'steady',
    name: 'Steady',
    priceLabel: '₹1,499 / month',
    tagline: 'Keeps a site that is already working online, secure, and quietly up to date — nothing breaks, nothing goes stale.',
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
    tagline: 'Forge actively reviews and improves the site every quarter, not just keeps it running — for businesses whose offer changes month to month.',
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
    tagline: 'A direct line to Forge and first access to every new capability — for a business treating its website as a growing asset, not a fixed cost.',
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

/**
 * Excluded from every Maintenance tier, regardless of price — legacy/
 * operator.html "Not included" section, docs/forge-business-rules.md §9.
 * Shown on /maintenance so scope stays transparent rather than implied.
 */
export const MAINTENANCE_EXCLUSIONS = [
  'New pages, sections, or features beyond what already launched',
  'Logo design or brand identity work',
  'Ad campaigns or social media management',
  'Copywriting beyond light edits to existing text',
  'Photography or video production',
  'Major replatforming or a full site rebuild',
] as const

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
// Referral reward — lib/referrals.ts reads this to decide what, if
// anything, to promise a referrer. No monetary or in-kind reward exists
// anywhere in the business rules (forge-business-rules.md HD#6: "Whether
// to build a referral program, and its mechanics — nothing currently
// exists to base a decision on"). rewardType/rewardValue stay null,
// status stays 'tbd', until the business owner actually decides one —
// same pattern as CAPACITY and the ₹25,000 tier above. The referral
// system itself (lib/referrals.ts) works fully without this being set;
// it only gates whether a reward is ever described as "pending" instead
// of "not applicable."
// ---------------------------------------------------------------------

export interface ReferralRewardConfig {
  rewardType: 'credit' | 'discount' | 'cash' | null
  rewardValue: number | null
  status: 'confirmed' | 'tbd'
}

export const REFERRAL_REWARD_CONFIG: ReferralRewardConfig = {
  rewardType: null,
  rewardValue: null,
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
// Tools (/tools, /tools/[slug]) — the Forge Website Diagnostic suite
// (lib/website-analyzer/), 12 tools built on one reusable homepage
// analysis engine (lib/website-analyzer/analyzer.ts). No tool
// re-implements any fetching/parsing/scoring logic — every one filters
// the same analysis to its own category. See docs/tool-architecture.md
// and docs/tool-security.md.
//
// ToolDefinition and its supporting types live in lib/tools/types.ts —
// the single source of truth for the zero-cost tools architecture (see
// docs/tools-cost-policy.md and docs/tool-cost-matrix.md). Every entry
// added here is checked by lib/tools/__tests__/cost-policy.test.ts.
//
// WEBSITE_ANALYZER_TOOLS is imported here, not the other way around —
// lib/website-analyzer/tools.ts deliberately does NOT import from this
// file (even though it needs AUDIT_HREF/AUDIT_CTA_LABEL, defined below
// in this same file) specifically to avoid a circular module
// dependency; see that file's own comment for why. If AUDIT_HREF/
// AUDIT_CTA_LABEL below ever change, lib/website-analyzer/tools.ts's
// inlined copies need updating too.
// ---------------------------------------------------------------------

import type { ToolDefinition } from '@/lib/tools/types'
export type { ToolDefinition } from '@/lib/tools/types'
import { WEBSITE_ANALYZER_TOOLS } from '@/lib/website-analyzer/tools'

export const TOOLS: ToolDefinition[] = [...WEBSITE_ANALYZER_TOOLS]

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
