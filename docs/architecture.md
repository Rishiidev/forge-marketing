# Forge Marketing — Architecture

This describes the rebuilt public marketing site (`forge.bruuhh.com`).
The customer application (`app.forge.bruuhh.com`) is a separate,
not-yet-built surface — see "Out of scope" below.

## Current (baseline) architecture

The pre-rebuild site — 9 self-contained static HTML pages (inline CSS
and JS each), a shared `forge-wa-submit.js` form handler, and two Vercel
serverless functions in `api/` (lead capture fan-out to Resend/Supabase/
GitHub) — is preserved unmodified in `legacy/`. See `legacy/README.md`
and `docs/legacy-readme.md` for what the original authors documented
about it.

## Target architecture (this rebuild)

**Stack:** Next.js 15 (App Router), TypeScript (strict), Tailwind CSS
v3, MDX content via `next-mdx-remote/rsc` + `gray-matter` (no CMS — see
"Why no CMS" below).

**Routing.** One route per marketing surface, matching the brief
exactly: `/`, `/audit`, `/websites`, `/websites/5000`, `/websites/15000`,
`/websites/25000`, `/maintenance`, `/showcases`, `/showcases/[slug]`,
`/tools`, `/tools/[slug]`, `/blog`, `/blog/[slug]`. The three website-
tier routes are separate static route folders (not one dynamic
`[tier]` route) because the brief named them explicitly as distinct
routes; they all render the same shared `WebsiteTierPage` template
component reading from one data source, so there's no content
duplication between them.

**Data layer.** All business data (pricing, maintenance plans, capacity,
industry templates, tools registry, nav) lives in `lib/constants.ts`.
No component or page hard-codes a price, feature list, or contact
detail — see `docs/forge-business-rules.md` for where each value came
from, and note that several fields are deliberately `null` /
`status: 'tbd'` where the business rules document marks something
unresolved (the ₹25,000 tier's price, the site-wide contact email and
WhatsApp number). Components render a visible "pending confirmation"
state for these rather than a placeholder that looks real.

**Content layer.** `content/blog/*.mdx` and `content/showcases/*.mdx`,
read at build/request time by `lib/content.ts` (frontmatter via
`gray-matter`, rendered via `next-mdx-remote/rsc`). One example entry
exists in each collection, clearly marked as a placeholder — no real
client is showcased without the consent question in
`docs/forge-business-rules.md` §16 being resolved first.

**Why no CMS.** The brief said "do not build a CMS unless genuinely
required." A filesystem + MDX content layer covers the stated need
(blog posts, showcase write-ups) with no database, no admin UI, and no
external service — adding a CMS now would be exactly the "unnecessary
backend infrastructure" the brief also said not to build.

**Lead capture (CRM abstraction).** `lib/crm.ts` exports
`captureLead()`, `trackLeadEvent()`, and `updateLeadStage()` behind a
`CrmProvider` interface. The active provider is selected by the
`CRM_PROVIDER` env var:
- `console` (default) — logs locally, always succeeds. Used automatically
  when no provider is configured, so development never requires real
  credentials.
- `webhook` — POSTs the lead as JSON to `CRM_WEBHOOK_URL`. This is the
  documented, vendor-neutral integration path (works with Zapier, Make,
  a custom endpoint, or a HubSpot forms-relay endpoint) without any
  vendor-specific code in this repo.
- `hubspot` — a named stub showing the shape a real integration would
  take. Not implemented; throws a clear error if selected, rather than
  silently dropping leads.

Every form on the site calls one Server Action
(`app/actions.ts` → `submitLeadAction`), which validates input, checks
the honeypot field (carried forward from the legacy forms), and calls
`lib/crm.ts`. No page or component talks to a CRM directly. Swapping
providers, or adding a real one, means editing `lib/crm.ts` only.

**Analytics.** `lib/analytics.ts` exports `trackEvent()` behind a
swappable `AnalyticsProvider`. It no-ops (console-only in development)
by default. **Do not** wire a real analytics vendor into it without
first resolving `docs/forge-business-rules.md` Human Decision #12 —
`legacy/privacy.html` makes a live public promise of "no third-party
trackers," and an independent audit confirmed the legacy site has zero
analytics scripts. Silently adding one in the rebuild would contradict
that promise.

**SEO.** `lib/seo.ts`'s `buildMetadata()` is the only way pages set
title/description/canonical/OpenGraph metadata. The legacy site had
canonical tags on 3 of 9 pages and OpenGraph on 1 of 9
(`docs/forge-business-rules.md`); routing every page through one helper
is what fixes that structurally rather than page-by-page.

**Design system.** Token values live in `lib/design-tokens.ts` (colors,
type scale, radius, shadow, container widths, motion easing, breakpoints)
— `tailwind.config.ts` wires them into Tailwind, and
`app/design-system/page.tsx` (an internal, `noindex`, unlinked preview
route) renders them directly from the same file, so the preview can never
drift from the real tokens. Colors are lifted from `legacy/index.html`'s
CSS custom properties — the most complete of several slightly-divergent
legacy palettes — as a starting point, not a confirmed final brand
decision; the type scale, radius, shadow, and motion tokens are new for
this rebuild. See `docs/decisions.md` ADR-005 for the positioning
rationale (premium/confident/technical, not generic-SaaS or
template-marketplace).

`components/ui/*` are the design-system primitives: `Container`,
`Section`, `Heading`, `Text`, `Button`, `Link`, `Badge`, `Card`, `Input`,
`Textarea`, `Select`, `Accordion`, `Divider`. Every heading and body-copy
font size in the app goes through `Heading`/`Text` (or the raw
`text-{token}` utility class they wrap) — no component reaches for
Tailwind's removed default `text-sm`/`text-lg`/etc. scale. Every other
component folder builds on these primitives; `components/forms/TextField`
and `SelectField` are labeled wrappers around `ui/Input` and `ui/Select`.

## Component structure

```
components/
  ui/          Design-system primitives — Container, Section, Heading, Text, Button,
               Link, Badge, Card, Input, Textarea, Select, Accordion, Divider
  layout/      SiteHeader ("Navbar"), SiteFooter ("Footer")
  marketing/   Generic reusable blocks — PageHero, FeatureList, CTA, ProcessStep,
               Metric, Testimonial, Review, FAQ
  conversion/  WhatsAppFloat, CapacityStrip
  pricing/     PriceCard ("PricingCard"), PricingTierGrid, WebsiteTierPage (shared tier template)
  audit/       AuditForm
  showcases/   ShowcaseCard, ShowcaseGrid, ShowcaseViewTracker
  tools/       ToolCard, ToolGrid
  blog/        BlogCard, BlogList
  forms/       TextField, SelectField, Honeypot, SubmitButton, FormStatus, useLeadForm
```

## Lib structure

```
lib/
  constants.ts      Central business data — pricing, plans, capacity, nav, contact
  design-tokens.ts  Raw token data (colors, type scale, radius, shadow, motion,
                     breakpoints) — tailwind.config.ts and app/design-system both
                     import this; neither hand-copies a value. Logged as ADR-005.
  analytics.ts      trackEvent() abstraction, no-op by default (see above)
  crm.ts            captureLead()/trackLeadEvent()/updateLeadStage() + provider interface
  seo.ts            buildMetadata() — the only page-metadata entry point
  utils.ts          cn(), formatINR(), slugify()
  content.ts        MDX filesystem loader — an addition beyond the five files named in
                     the brief; logged as ADR-002 in docs/decisions.md
  showcases.ts      Showcase domain layer on top of content.ts — typed frontmatter,
                     publishable-entry filtering, featured selection. ADR-008.
```

## The homepage

Built per `docs/conversion-architecture.md`, in the exact 12-section
order specified there: Hero, Transformation (static, illustrative —
`components/marketing/TransformationCompare.tsx`), GBP→website
explanation, embedded Free Audit form, Problem, Process, Showcases (real
clients — see below), Pricing, Maintenance, Reviews/proof, FAQ, Final
CTA. All 12 sections are plain Server Components; the only Client
Components on the page are the ones that genuinely need interactivity
(`AuditForm`, `FAQ`/`Accordion`, `TrackedCtaLink`, `SiteHeader`'s mobile
menu) — per capita page JS is 922 B (see the build output).

**Real showcase content.** `content/showcases/` has three real entries
(Smile Care Dental Clinic, Asquare Venture, We Health Care Diagnostic
Centre) sourced verbatim from `legacy/5000-setup.html`. The homepage
shows up to 6 via `getFeaturedShowcases()` — see "The showcase system"
below for the full route/data-model design. This treats
`forge-business-rules.md` Human Decision #8 (showcase consent) as
resolved-by-instruction — the content was already public on the live
legacy site, so carrying it forward isn't a new disclosure — logged as
ADR-007.

**Pricing ladder naming.** `lib/constants.ts` `WEBSITE_TIERS[].name` is
now `Launch` / `Growth` / `Pro` (was `"₹5,000 Website"` etc.) — a
business-naming decision given directly in the homepage brief, applied
at the single source of truth so every consumer (`PriceCard`,
`WebsiteTierPage`) picked it up automatically.

**CTA consistency.** `lib/constants.ts` `AUDIT_CTA_LABEL` ("Get your
free audit") is now the one string every "go do the audit" CTA uses
site-wide (`SiteHeader`, `Hero`, `PriceCard`, `WebsiteTierPage`, the
homepage's repeated in-page CTAs, the final CTA) — previously three
different pages used three different phrasings.

**Capacity strip stays hidden.** `CAPACITY.status` (new field) is
`'tbd'`, and `CapacityStrip` renders nothing when it is — per
`docs/conversion-architecture.md`: no urgency is better than fake
urgency. It will render again automatically once a real, current
`remaining`/`nextReset` is set and `status` flips to `'confirmed'`.

## The showcase system

`/showcases` (index) and `/showcases/[slug]` (detail), backed by
`lib/showcases.ts` on top of `lib/content.ts`. Purpose: prove actual
Forge work, not a generic portfolio — every detail page answers who the
business is, what Forge built, why they needed it, what it looks like,
what the customer says (only if real), where to see it live, and closes
with "could Forge do this for my business?"

**Data model.** `ShowcaseFrontmatter` (`lib/showcases.ts`) carries every
field the brief named — `name`, `industry`, `location`, `websiteUrl`,
`description`, `problem`, `solution`, `services`, `review`/
`reviewAuthor`/`reviewRole`/`reviewRating`, `screenshots`,
`featuredImage`, `launchDate`, `featured`, `metrics` — all optional
except `name`/`industry`/`websiteUrl`/`description`. A showcase missing
those four is filtered out of every listing and 404s at its own slug
(`isPublishable()` in `lib/showcases.ts`) rather than rendering a page
with holes in it. No field is ever defaulted to a placeholder value —
every conditional in `app/showcases/[slug]/page.tsx` renders nothing
when the real data doesn't exist, per the brief's "do not fabricate"
instruction.

**One card, one detail page.** `components/showcases/ShowcaseCard.tsx`
is the single grid-card component, used by both `/showcases` and the
homepage's Showcases section (`getFeaturedShowcases(6)`) — business,
industry, image (a CSS background, not `<img>`/`next/image`, so an
arbitrary future client-hosted URL never needs a `next.config.mjs`
domain change), short description, review excerpt if one exists, and a
CTA into the detail page. This replaces the homepage-only
`ShowcaseProofCard` and the unused `CaseStudyCard` from the earlier
homepage pass — one card design, not two overlapping ones. Logged as
ADR-008.

**Scaling to hundreds of showcases.** Both routes are fully data-driven:
`generateStaticParams` comes from `getAllShowcases()`, and no page
hard-codes a slug, count, or per-client branch. Adding the 4th (or
400th) showcase means adding one `.mdx` file — no component or page
changes. Pagination for the index page isn't built, on purpose — with 3
real entries today, it would be speculative; the "scale to hundreds"
requirement is met at the data layer, not by pre-building UI for a
volume that doesn't exist yet.

**SEO.** Every showcase page routes through `buildMetadata()` (as
always) plus a JSON-LD `CreativeWork`/`LocalBusiness` block built
directly from the same frontmatter — no separate SEO content to keep in
sync, and no field appears in the structured data unless it's also real
enough to appear on the page itself.

**Review system — designed, not built.** The brief asked for an
architecture that lets reviews later be requested, approved, associated
with a customer, displayed, and linked to a showcase, without building
the collection workflow or a customer dashboard now. `review`,
`reviewAuthor`, `reviewRole`, and `reviewRating` are modeled as four
independent optional fields (deliberately separate from `metrics`, which
covers real aggregate numbers like a Google star rating that aren't a
quoted, attributed review) so that a future `reviews` record — keyed by
customer and showcase slug, with a `status: pending | approved` field —
can populate exactly these four fields without a rename or a data
migration. Until that workflow exists, a review is added the same way
every other showcase fact is: edited directly into the MDX frontmatter,
by a person, with the customer's consent already in hand.

**`showcase_viewed` is now wired.** `components/showcases/
ShowcaseViewTracker.tsx` fires it once per page view — the homepage
build deliberately left this event unwired because no page existed yet
where "viewed" meant something more specific than "saw the homepage."
`/showcases/[slug]` is that page.

## Out of scope (deliberately not built)

Per the rebuild brief: no customer dashboard, no authentication, no
payment processing, no CMS, and no code for `app.forge.bruuhh.com` (the
customer application).

## Constraints carried forward from the legacy codebase

- The capacity-cap mechanism (`legacy/index.html`'s `CAP` constant) is
  reimplemented as `lib/constants.ts` → `CAPACITY`, rendered by
  `components/conversion/CapacityStrip.tsx`. Same "one number drives
  everything" property, now typed and reusable instead of an inline
  `<script>` block.
- The honeypot spam-trap pattern (a hidden `website` field) is preserved
  in `components/forms/Honeypot.tsx` and checked in `app/actions.ts`.
- The three-leg lead fan-out in `legacy/api/submit.js` (Resend/Supabase/
  GitHub) is **not** migrated as-is — it's replaced by the provider
  abstraction in `lib/crm.ts` so a future decision on which vendor(s) to
  use doesn't require rewriting call sites again. See Human Decision #11
  in `docs/forge-business-rules.md`.
