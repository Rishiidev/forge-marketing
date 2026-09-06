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

**Lead capture (CRM adapter).** Full architecture, Lead model, lifecycle,
and rationale: [`docs/crm.md`](crm.md) — read that directly rather than
this summary. One line: `lib/crm.ts` exports six operations
(`createLead`/`updateLead`/`addLeadEvent`/`updateLeadStage`/
`addLeadTag`/`getLeadStatus`) behind a `CrmAdapter` interface, selected
by `CRM_PROVIDER` (`console` default / `webhook` / `hubspot` stub, same
three as before — see `docs/crm.md` §1). Every operation is rate-limited
and validated at the `app/actions.ts` layer, deduped and idempotency-keyed
at the provider layer, and never throws past its public export — a CRM
outage degrades gracefully rather than breaking the page calling it
(`docs/crm.md` §8). `lib/validation.ts` and `lib/rate-limit.ts` are new,
small, shared helpers this required — see below.

**Analytics.** `lib/analytics.ts` exports `trackEvent()` behind a
swappable `AnalyticsProvider`. It no-ops (console-only in development)
by default. **Do not** wire a real analytics vendor into it without
first resolving `docs/forge-business-rules.md` Human Decision #12 —
`legacy/privacy.html` makes a live public promise of "no third-party
trackers," and an independent audit confirmed the legacy site has zero
analytics scripts. Silently adding one in the rebuild would contradict
that promise.

**SEO.** `lib/seo.ts`'s `buildMetadata()` is the only way pages set
title/description/canonical/OpenGraph metadata (an `'article'` `type`
option was added for the blog, ADR-014 — every other caller is
unaffected). The legacy site had canonical tags on 3 of 9 pages and
OpenGraph on 1 of 9 (`docs/forge-business-rules.md`); routing every page
through one helper is what fixes that structurally rather than
page-by-page. `buildBreadcrumbJsonLd()` (`lib/seo.ts`) pairs with
`components/marketing/Breadcrumbs.tsx` for structured-data breadcrumbs.
`app/sitemap.ts`/`app/robots.ts` (ADR-014) are the App Router's native
`MetadataRoute` files, served at `/sitemap.xml`/`/robots.txt`. The only
`noindex` anywhere in this codebase is `/design-system`'s, set
page-locally — verified with a live-browser check (ADR-014, checkpoint
2026-09-06) that nothing else, including the entire blog, carries one.

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
               Metric, Testimonial, Review, FAQ, Breadcrumbs
  conversion/  WhatsAppFloat, CapacityStrip
  pricing/     ForgePricing (homepage pricing section: heading + PricingTierGrid +
               decision aid, ADR-020), PriceCard ("PricingCard"), PricingTierGrid,
               PricingComparisonTable, WebsiteTierPage (shared tier template)
  audit/       AuditForm (still used on the homepage/design-system), plus the
               Forge Free Audit tool: AuditTool, AuditInputForm, AuditProcessing,
               AuditResultView, AuditLeadCaptureForm — see "The audit tool system"
  showcases/   ShowcaseCard, ShowcaseGrid, ShowcaseViewTracker
  tools/       ToolCard, ToolGrid
  blog/        BlogCard, BlogList, ArticleHeader, ArticleBody, TableOfContents,
               RelatedArticles, ArticleCTA, BlogViewTracker — see "The blog system"
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
  crm.ts            CrmAdapter — createLead/updateLead/addLeadEvent/updateLeadStage/
                     addLeadTag/getLeadStatus + provider interface. docs/crm.md, ADR-010.
  seo.ts            buildMetadata() — the only page-metadata entry point, plus
                     buildBreadcrumbJsonLd(). ADR-014.
  utils.ts          cn() (tailwind-merge, extended with Forge's custom font-size
                     scale — ADR-015), formatINR(), slugify()
  content.ts        MDX filesystem loader — an addition beyond the five files named in
                     the brief; logged as ADR-002 in docs/decisions.md
  showcases.ts      Showcase domain layer on top of content.ts — typed frontmatter,
                     publishable-entry filtering, featured selection. ADR-008.
  audit.ts          Forge Free Audit scoring engine — question set, computeAuditResult(),
                     recommendation logic. Pure, client-safe (no server-only import) —
                     the result is computed instantly in the browser. ADR-009.
  validation.ts     isValidEmail(), normalizeUrl() — shared by Server Actions and the
                     audit tool's client-side form. Client-safe. ADR-010.
  rate-limit.ts      In-memory fixed-window rate limiter for lead-capture actions.
                     Server-only. Single-process — see docs/crm.md "Known limitations." ADR-010.
  file-store.ts      Minimal JSON-file-backed key-value store (.data/*.json) — what the
                     console CRM provider, lib/referrals.ts, and lib/reviews.ts actually
                     persist to. Not a database; exists because a bare in-memory Map is
                     not reliably shared between a Route Handler and a Server Action in
                     this framework. Server-only. ADR-013.
  referrals.ts       Referral codes/URLs, click tracking, attribution, reward status —
                     no monetary reward defined (HD#6). ADR-012.
  reviews.ts         Review collection (three independent consents) + showcase-candidate
                     eligibility. Gates both on real delivery having happened. ADR-012.
  blog.ts            Blog domain layer on top of content.ts — BLOG_CATEGORIES (the nine
                     topic clusters), typed frontmatter, getRelatedPosts(),
                     extractHeadings() for the table of contents. ADR-014.
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

## The audit tool system

`/audit`, rebuilt this session from a single contact-form page into a full
interactive tool (`components/audit/AuditTool.tsx`). Flow: landing →
input → processing → result (which itself renders the recommendation and
CTA) — see ADR-009.

**No live Google Business Profile API integration exists** (no
credentials, no `.env`). Per the brief: "if a live API integration is
unavailable, design a truthful fallback input flow." The fallback is a
9-question, self-report questionnaire (`lib/audit.ts` `AUDIT_CATEGORIES`)
covering business information, website presence, contactability, reviews,
service clarity, mobile experience, online credibility, local
discoverability, and conversion friction — the exact nine categories
named in the brief. Every line of the result is a direct, deterministic
function of what the visitor answered; nothing about a specific business
is looked up or invented.

**Scoring.** Each question's three options are tagged `strong` / `weak` /
`missing`. `computeAuditResult()` (`lib/audit.ts`) is a pure function —
same input always produces the same output, no weighting, no randomness —
which is the mechanism behind "do not deliberately make the score
artificially poor to sell Forge." There is deliberately no single numeric
score; the result is per-category (what's good / what's missing / why it
matters / what to do next) plus a plain count ("6 of 9 areas are strong…").

**Recommendation.** A fixed, disclosed priority order (`PRIORITY_ORDER` in
`lib/audit.ts`) picks the single highest-leverage category to fix first.
Three branches only: no website at all → Launch (`/websites/5000`); has a
website but another category is the top gap → Growth (`/websites/15000`,
since Launch explicitly excludes revisions/custom work — the wrong fit for
an existing site); every category strong → Maintenance (`/maintenance`),
never a fabricated gap. Pricing in the recommendation text is pulled live
from `lib/constants.ts` (`getWebsiteTier`, `MAINTENANCE_PLANS`), never
hard-coded, so it can't drift from the real pricing pages.

**CRM.** The tool talks to the CRM exactly once, at the very end, and only
if the visitor chooses to (`components/audit/AuditLeadCaptureForm.tsx`) —
nothing is gated behind giving contact info. `lib/crm.ts` `Lead.email` is
now optional (an "identifiable" lead can be email-only, WhatsApp-only, or
neither — in which case nothing is captured at all, matching
`docs/conversion-architecture.md` §5's existing "no dead-end lead record
for a non-converting visitor" rule for the Anonymous/Tool User stages). A
new Server Action, `submitAuditLeadAction` (`app/actions.ts`), handles
this specifically rather than reusing the generic `submitLeadAction`
(which still hard-requires a valid email for every other form on the
site, unchanged). A successful capture sets `LeadStage` to the new
`'audit-lead'` value and records business/URL/industry/location/audit
result summary/source/landing page/UTM parameters/timestamp in `Lead.meta`.

**Analytics.** Five events: `audit_started` (landing → input),
`audit_submitted` (input → processing), `audit_completed` and
`audit_result_viewed` (processing → result, fired together —
`components/audit/AuditResultView.tsx`), and `audit_cta_clicked` (the
recommendation CTA). See `docs/decisions.md` ADR-009 for why
`audit_completed`'s meaning changed from `docs/conversion-architecture.md`
§7's original definition.

**What replaced what.** The previous `/audit` page (a single
`AuditForm` embed) is gone from this route. `components/audit/AuditForm.tsx`
itself is untouched and still used on the homepage and `/design-system` —
out of scope for this change, not forgotten.

## Post-sale growth architecture

`lib/reviews.ts` and `lib/referrals.ts` — the loop after a website is
actually delivered: **Customer → Success → Review → Showcase → Referral →
New Customer**. Full rationale: `docs/decisions.md` ADR-012. Both are
file-backed, single-machine modules (`lib/file-store.ts` — see
`docs/decisions.md` ADR-013 for why a bare in-memory `Map` genuinely
doesn't work here, and `docs/crm.md` "Known limitations" for what a file
store still doesn't guarantee), built on top of the existing
`CrmAdapter` (`lib/crm.ts`) rather than adding to it — neither module
needed a new adapter operation; both compose
`updateLead`/`updateLeadStage`/`addLeadTag`/`addLeadEvent`/`getLeadStatus`.

**The ₹5,000 tier's delivery never depends on either module.** Nothing
in the purchase/delivery path calls `lib/reviews.ts` or
`lib/referrals.ts`, and neither module can block or gate a delivery —
they only ever act on a lead that has already reached a post-delivery
stage. This is enforced at the data layer (both files check
`getLeadStatus()` against a fixed `POST_DELIVERY_STAGES` /
`CAN_REFER_STAGES` set before doing anything), not left as a documentation
promise.

**Reviews.** `requestReview(leadId)` refuses before delivery, then moves
the lead to `'review-requested'`. `submitReview()` records the honest
review (no pre-written quote, no rating floor) and three **independent**
consent flags — `website` / `showcase` / `marketing` — matching the
brief's three listed uses exactly. None defaults to true; each is a
separate, explicit grant, per the existing anti-fabrication rule that
consent for one use is never implied by another (`forge-business-rules.md`
§16, HD#8; `ADR-008`).

**Showcase eligibility.** `checkShowcaseEligibility(leadId)` is the
"underlying data structure" the brief asked for — it checks delivery,
a received review, and `consent.showcase`, independently, and returns a
reason when any is missing rather than a bare boolean. It has no
knowledge of `content/showcases/*.mdx` and touches nothing there —
actually publishing a showcase entry is still the same deliberate manual
step it always was (a person writes the `.mdx` file, `ADR-008`).
`markShowcaseCandidate()` only moves the CRM lead to
`'showcase-candidate'`; a person moves it to `'showcase-published'` by
hand once a real entry ships, the same way every stage past `'audit-lead'`
is moved today (`docs/crm.md` §4) — no automatic pipeline exists, and
none was asked for here.

**Referrals.** `createReferralCode(leadId)` — the "unique referral
identifier" — is idempotent and refuses before a lead has actually been
delivered (`CAN_REFER_STAGES`), returning the referral URL
(`{SITE.marketingUrl}/r/{code}`). No monetary or in-kind reward is
defined anywhere (`REFERRAL_REWARD_CONFIG` in `lib/constants.ts`,
`status: 'tbd'`, matching `forge-business-rules.md` HD#6 exactly) — every
reward-status value stays `'tbd'` until the business owner sets one;
nothing here promises a specific reward.

**`/r/[code]`** (`app/r/[code]/route.ts`) works today with no customer
app or dashboard, per the brief's explicit ask. A Route Handler, not a
page, because it needs to set a 30-day attribution cookie before
redirecting — something a Server Component can't do during render. It
always forwards to `/audit`, recognized code or not; a broken or
mistyped referral link never dead-ends a visitor, it just arrives
without attribution instead of with it. Attribution itself
(`attributeReferralLead`) fires from `app/actions.ts`, once, only for a
genuinely new (non-deduped) lead — the referral cookie is read
server-side via `cookies()`, never trusted from a client-supplied field.

**Events.** `referral_lead` and `referral_conversion` were added to
`lib/crm.ts`'s `LeadEventName` — both fire against a real `leadId`
(the referred lead), matching every other event in that taxonomy.
`referral_click` deliberately isn't one of them: a click on `/r/[code]`
is anonymous, with no lead yet to attach an `addLeadEvent()` call to —
it's tracked as a plain counter on the `ReferralCode` record instead.
See `docs/crm.md` "Events vs. analytics" for the same reasoning applied
to the audit tool's own events.

**No manipulative language, nowhere for it to appear yet.** No
customer-facing referral UI exists in this codebase — the brief asked
specifically not to build the dashboard yet, and the redirect itself has
no visible copy. When that dashboard is eventually built, it should
describe the referral mechanism plainly (what happens, when, to whom)
without urgency, guilt, or reward-teasing language — the same standard
`forge-business-rules.md` §18 already sets for every other page.

**What this deliberately doesn't build:** a customer-facing referral
dashboard (explicitly out of scope for this pass), a review-submission
page/form (the brief didn't ask for one the way it asked for `/r/[code]`
specifically — `lib/reviews.ts` is ready for one to be built against),
and any automatic "purchase confirmed" → `'customer'` trigger (no
payment processing exists in this codebase at all — see "Out of scope"
below — so `markReferralConverted()` and every stage transition past
`'audit-lead'` stay manual/ops-triggered, same as before this work).

## The blog system

`/blog` (index, with a `?category=` filter) and `/blog/[slug]`, backed by
`lib/blog.ts` on top of `lib/content.ts`. Full rationale: `docs/decisions.md`
ADR-014. Purpose: answer real questions a visitor searches for
(Google Business Profile, local SEO, websites, reviews, conversion) —
the brief was explicit that this is not a page built to generate a URL.

**Data model and topic clusters.** `BlogFrontmatter` — `title`,
`description`, `date`, `author`, `category`, `tags`, optional
`featuredImage`, optional `ctaHref`/`ctaLabel` — with `category`
constrained to nine named topic clusters (`BLOG_CATEGORIES`), not a
free-text field. A post missing title/description/date/author/a valid
category is filtered out of every listing, same `isPublishable()`
pattern as showcases (`ADR-008`).

**Internal linking is structural, not incidental.** `getRelatedPosts()`
scores other posts by shared category then shared tags and renders via
`RelatedArticles`; every real post also links inline to at least one
other post, a relevant pricing tier, or a showcase.

**`article → relevant tool → audit → Forge`, never `article → "BUY NOW"`.**
`ArticleCTA` always offers the free audit as the one action relevant to
every visitor, plus an optional second link a post sets via its own
`ctaHref`/`ctaLabel` frontmatter — pointing at whatever's actually
relevant to that post's topic, entirely through content, no component
change required per post.

**Table of contents without new client JS.** `extractHeadings()`
regexes `##`/`###` out of the raw MDX; `ArticleBody` computes the same
anchor id at render time via the same `slugify()`, so `TableOfContents`
links resolve correctly without the two sharing one parse pass. Pure
server-rendered nav — no scroll-spy, per "avoid unnecessary client-side
JavaScript."

**Optimized images.** Unlike the showcase system (which deliberately
uses a CSS background to avoid a `next.config.mjs` domain change for an
arbitrary future client URL), blog images are first-party and go
through `next/image` — `featuredImage` in `BlogCard`/`ArticleHeader`,
and in-body markdown images via `ArticleBody`'s `img` override inside a
fixed `aspect-video` frame. No `featuredImage` was invented for the real
posts shipped with this system; the field renders nothing when absent.

**Full SEO surface.** `buildMetadata()` gained an `'article'` type
(OpenGraph `publishedTime`/`authors`); `buildBreadcrumbJsonLd()` +
`components/marketing/Breadcrumbs.tsx` render the same trail as both
visible breadcrumbs and `BreadcrumbList` structured data; `/blog/[slug]`
also emits `BlogPosting` structured data, every field a direct copy of
real frontmatter, same rule as showcases' `CreativeWork` block.
`app/sitemap.ts`/`app/robots.ts` are the App Router's native
`MetadataRoute` files — the sitemap pulls straight from
`getAllShowcases()`/`getAllPosts()`/`WEBSITE_TIERS`, so a new post or
showcase appears in it automatically. `/design-system` stays out via its
existing page-level `noindex`, not a robots.txt disallow (which would
stop a crawler from ever seeing that tag); `/r/[code]` and `/api/*` are
disallowed as non-content utility routes.

**Scaling.** Same guarantee as showcases (`ADR-008`): a new post is one
`.mdx` file with the required frontmatter. `generateStaticParams` comes
from `getAllPosts()`; the category filter is driven by
`BLOG_CATEGORIES`, not a per-category page. Nothing here needs a page or
component change to add the 4th or 400th post.

**`blog_viewed` is now wired**, via `BlogViewTracker` — same
one-Client-Component pattern `ShowcaseViewTracker` established (`ADR-008`).

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
