# Forge Marketing — Decision Log

> **PLACEHOLDER DOCUMENT.** Architecture Decision Records (ADRs) for the
> rebuild go here, one per decision, in the format below. No decisions
> have been recorded yet beyond repository setup.

## Format

```
## ADR-NNN: <title>
Date: YYYY-MM-DD
Status: proposed | accepted | superseded

Context:
Decision:
Consequences:
```

## Log

### ADR-000: Establish baseline repository

Date: `[PLACEHOLDER — fill in actual date]`
Status: accepted

Context: The existing Forge marketing site lived only in the original
`Rishiidev/forge` repository, mixed with unrelated history. A clean,
reversible baseline was needed before any rebuild work started.

Decision: Created a new repository (`forge-marketing`) with a single
baseline commit containing the untouched existing site, followed by a
docs-scaffold commit. All rebuild work happens on the `rebuild` branch.

Consequences: The baseline commit is the reference point for "what the
site looked like before the rebuild." Nothing in it should be treated as
a design or business decision — see `docs/forge-business-rules.md` for
open questions the baseline surfaced (conflicting pricing, placeholder
contact info, etc.).

### ADR-001: Next.js/TypeScript/Tailwind/MDX rebuild architecture

Date: 2026-09-05
Status: accepted

Context: The brief specified an exact stack (Next.js App Router,
TypeScript, Tailwind, MDX, reusable components) and an exact route list,
component-folder structure, and lib-file list, with explicit exclusions
(no customer dashboard, no auth, no payments, no CMS unless genuinely
required, no unnecessary backend infrastructure) and an explicit
instruction not to build the homepage yet.

Decision: Scaffolded the rebuild at the repository root (moving the
legacy static site into `legacy/` first — see below), using Next.js 15
App Router + TypeScript strict mode + Tailwind v3 + `next-mdx-remote/rsc`
for MDX content read straight off disk (no CMS). Business data is
centralized in `lib/constants.ts`; CRM and analytics are behind
provider-swappable abstractions (`lib/crm.ts`, `lib/analytics.ts`) so no
vendor is hard-coded. Every page routes metadata through
`lib/seo.ts`. The homepage (`app/page.tsx`) is a bare, explicitly-labeled
placeholder, per the brief.

Consequences: The architecture is provably wired end-to-end — typecheck,
lint, and `next build` all pass, and the lead-capture pipeline (form →
Server Action → `captureLead()` → console provider) was verified live in
a browser, not just by a green build. Two data points needed for a real
launch are still unresolved and are surfaced as visible "pending
confirmation" UI states rather than guessed: the ₹25,000 tier's exact
scope/price, and the site's real contact email/WhatsApp number. See
`docs/forge-business-rules.md` "HUMAN DECISIONS REQUIRED."

### ADR-002: `lib/content.ts` added beyond the five named lib files

Date: 2026-09-05
Status: accepted

Context: The brief named exactly five `lib/` files
(constants/analytics/crm/seo/utils). MDX content (a brief requirement)
needs a filesystem loader (read `.mdx` files, parse frontmatter, list/
sort entries) that didn't fit naturally into any of the five — `utils.ts`
is meant to be generic, not content-domain-specific.

Decision: Added `lib/content.ts` as a sixth lib file, scoped narrowly to
reading `content/blog` and `content/showcases`.

Consequences: One small, explicitly-logged deviation from the literal
file list, in service of an explicit requirement (MDX) that had nowhere
else to go. No other unlisted lib files were added.

### ADR-003: Legacy static site relocated to `legacy/`, not deleted

Date: 2026-09-05
Status: accepted

Context: Next.js's App Router conventions (root `app/page.tsx`,
`package.json` describing a Next app, etc.) can't coexist cleanly with 9
root-level static HTML files and a static-site `package.json`/
`vercel.json` in the same location. The standing instruction throughout
this project has been to preserve, never delete, the original code.

Decision: Moved every legacy file (`*.html`, `forge-wa-submit.js`,
`api/`, images/icons, the old `package.json` and `vercel.json`) into
`legacy/` via `git mv`, in its own commit, before adding any new
application code.

Consequences: Nothing was deleted or edited — `git log` shows the exact
move, and the original baseline commit on `main` still has everything at
the original paths if it's ever needed. The new root is clean for the
Next.js app. `legacy/` is explicitly excluded from linting/typechecking
(`tsconfig.json` `exclude`, `.eslintrc.json` `ignorePatterns`) and is not
part of the deployed build.

### ADR-004: CSP `script-src` must allow `'unsafe-eval'` in development only

Date: 2026-09-05
Status: accepted

Context: The security headers adapted from `legacy/vercel.json` into
`next.config.mjs` originally used a strict `script-src 'self'
'unsafe-inline'` in all environments. Verifying the lead-capture form in
a real browser (not just a green build) surfaced that this silently
broke all client-side JavaScript in `next dev` — Next's webpack dev
runtime (React Refresh/HMR) uses `eval()`, which a strict CSP blocks
with no visible error in a static screenshot, only in the console and in
broken interactivity (the audit form did not submit).

Decision: `next.config.mjs` now sets `script-src` to include
`'unsafe-eval'` only when `NODE_ENV !== 'production'`. Production builds
keep the strict policy.

Consequences: This is why the brief's instruction to actually run
typecheck/lint/build was not sufficient on its own to catch this — a
production build has no dev-runtime eval calls to trip the CSP, so
`next build` succeeding does not prove client-side interactivity works.
Verified by starting the dev server and submitting the audit form in a
live browser (see session notes); the lead reached
`lib/crm.ts`'s console provider correctly after the fix.

### ADR-005: Design system — token architecture and positioning

Date: 2026-09-05
Status: accepted

Context: The brief asked for a coherent visual language before building
major pages, with an explicit positioning brief (premium, clear, modern,
confident, practical, technical, trustworthy, productized — explicitly
**not** generic-agency, freelancer-portfolio, template-marketplace, or
"AI-generated SaaS landing page"), a full token set (color, type,
spacing, radius, border, shadow, container, breakpoint, motion, focus),
a fixed list of primitives and marketing components, and an internal
preview route. It also asked to use 21st.dev "where it improves the
experience." 21st.dev's MCP integration (server name `magic`) was
unauthenticated for this session (confirmed at connection time — see the
error surfaced to the user) — no real 21st.dev component was fetched.
Every component below was hand-built against Forge's own tokens instead
of adapted from a fetched reference.

Decision:
- Token values live in one place, `lib/design-tokens.ts`, imported by
  both `tailwind.config.ts` (to actually apply them) and
  `app/design-system/page.tsx` (to render them for inspection) — never
  duplicated between the two.
- Replaced Tailwind's default color palette and font-size scale entirely
  (not `extend`ed) for `colors` and `fontSize`, so no component can
  accidentally reach for a generic `blue-500` or `text-lg` outside the
  named Forge scale. Verified nothing in the existing codebase depended
  on a default-palette color before doing this; every existing
  `text-{size}` usage was migrated to the new named scale
  (`text-caption`/`body-sm`/`body`/`body-lg`/`heading-sm`/`heading-md`/
  `heading-lg`/`heading-xl`/`display`) as part of this change, not left
  on two parallel scales.
- `borderRadius` and `boxShadow` are similarly a small, closed set (radii
  sm through 2xl plus full; three shadow elevations, ground-tinted rather
  than neutral black) — a deliberately narrow palette of choices is part
  of what reads as "a repeatable system" rather than an assortment of
  one-off values.
- Motion is restricted to hover/active feedback, focus states, and
  expand/collapse (Accordion, mobile nav) using one easing token
  (`ease-forge`, legacy's own cubic-bezier) — no scroll-triggered reveal
  animations were rebuilt from the legacy site's `IntersectionObserver`
  pattern; the brief asked for motion only where it aids hierarchy/
  understanding/feedback, not decoration.
- Every primitive and marketing component named in the brief was built:
  ui/ (Container, Section, Heading, Text, Button, Link, Badge, Card,
  Input, Textarea, Select, Accordion, Divider) and marketing components
  (CTA, ProcessStep, Metric, Testimonial, Review, FAQ, plus the
  already-existing PriceCard/ShowcaseCard/BlogCard/ToolCard/AuditForm,
  and a new CaseStudyCard). Navbar/Footer were not duplicated under new
  names — the existing SiteHeader/SiteFooter (docs/architecture.md) were
  extended in place (SiteHeader gained a working mobile menu, which it
  was missing) rather than creating parallel components with the brief's
  literal naming.
- `Metric`, `Testimonial`, `Review`, and `CaseStudyCard` carry explicit
  doc-comment warnings against fabricated content, tying back to
  docs/forge-business-rules.md §15/§18. `/design-system` demonstrates
  them with content clearly labeled "Example" — this is the ONLY place
  in the app they currently appear, since no real testimonial, review,
  or metric exists yet (Human Decisions #7/#8).

Consequences: `/design-system` (noindex, not in `NAV_LINKS`) is a live,
buildable inventory of every token and component — verified in a real
browser, not just a passing build (see the ADR-004 lesson: this session
independently caught a real bug, duplicate React keys in the `Metric`
demo, via the Next.js dev overlay during that same verification pass,
not via typecheck/lint/build). Because 21st.dev couldn't be used, there
is no external reference to compare these components against — if the
business owner has specific 21st.dev components in mind, that requires
re-authenticating the `magic` MCP server in a future session.

### ADR-006: Conversion architecture written before the homepage

Date: 2026-09-05
Status: accepted

Context: The brief specified an exact primary funnel
(`Visitor → Free Audit → Qualified Lead → Sales Conversation → ₹5,000
Website`) plus three secondary funnels, ten named objections, a required/
prohibited persuasion-principle list, a full CRM lead lifecycle (13
stages), minimum CRM fields, and an analytics event taxonomy — all to be
returned as a document before any homepage implementation.

Decision: Wrote `docs/conversion-architecture.md` covering all of the
above. Treated the brief's stated primary funnel as a working-assumption
resolution of `forge-business-rules.md` Human Decision #1 (which funnel
is canonical) for planning purposes only, and flagged that assumption
back on HD#1 itself rather than silently overwriting the TBD. The CRM
lifecycle and analytics taxonomy are specified as a superset of what
`lib/crm.ts` (`LeadStage`) and `lib/analytics.ts` (`AnalyticsEvent`)
currently implement — this pass is design only; extending those types
and wiring the new events/stages is future implementation work.

Consequences: Every conversion mechanism proposed (capacity strip,
showcase proof, review/referral loop, upgrade path) is written to
degrade honestly when its prerequisite is missing — e.g. the capacity
strip is specified as absent-not-faked when no real cap exists, showcase
entries are specified as consent-gated rather than backfilled from the
three unconsented legacy examples. Six open business decisions (HD#2,
#3, #6, #8, #12, and the standing #13 contact-channel gap) block parts
of this from being implementation-ready; they're listed at the end of
the new document rather than guessed at.

### ADR-007: Homepage built; real showcase consent treated as resolved-by-instruction

Date: 2026-09-05
Status: accepted

Context: The homepage brief said "use actual Forge work where
available" for the Showcases section. `docs/forge-business-rules.md`
§16 and Human Decision #8 flag that the three real client names/metrics
in `legacy/5000-setup.html` (Smile Care Dental Clinic, Asquare Venture,
We Health Care Diagnostic Centre) have no on-record consent-to-showcase
confirmation in the codebase.

Decision: Carried the three real entries into
`content/showcases/*.mdx` and onto the homepage, treating the direct
"use actual Forge work" instruction as the business owner resolving
HD#8 for this content. Key mitigating fact: this isn't new disclosure —
the same names, cities, and metrics were already public on the live
legacy site (`legacy/5000-setup.html`) before this rebuild touched them.
No metric or quote was invented; the one real aggregate rating (Smile
Care's 4.9★/82 reviews) is reproduced exactly, and the two clients
without a stated rating show only the same factual outcome line the
legacy site already published for them.

Consequences: HD#8's formal question (a documented consent *process*
for future clients) remains open — this decision only covers carrying
forward content that was already public and already shipped by Forge
itself. A future client's showcase entry still needs real, on-record
consent before publishing, per §16.

Also in this pass: `lib/constants.ts` gained `AUDIT_CTA_LABEL` (one
consistent CTA string, replacing three different phrasings across
`SiteHeader`/`PriceCard`/`WebsiteTierPage`), tier names changed to
Launch/Growth/Pro (a naming decision given directly in the brief), and
`CAPACITY` gained a `status` field so `CapacityStrip` can safely stay
silent until real numbers exist. The analytics taxonomy from
`docs/conversion-architecture.md` §7 replaced the prior ad hoc event
names in `lib/analytics.ts` (`lead_form_submit` → `audit_started` +
`lead_submitted`, `whatsapp_click` → `whatsapp_clicked`, etc.) — this is
the "implementation work for the homepage build" ADR-006 deferred.
`pricing_viewed`/`showcase_viewed` are defined but not wired to a
scroll-observer this pass, per "avoid unnecessary client-side
JavaScript" — wire them if/when a real need for that granularity shows
up, not speculatively.

Verified live in a browser, not just a green build: desktop (1440px)
and mobile (375px) layouts, the mobile nav toggle, the FAQ accordion's
open/close state, and a full form → Server Action → `captureLead()`
round trip from the homepage-embedded audit form (a fresh lead ID was
generated and logged server-side). One environment limitation surfaced
and was isolated, not misdiagnosed as an app bug: programmatic
`.focus()` in this browser-automation tool doesn't dispatch a bubbling
native `focusin` event even to a plain `addEventListener` — confirmed
with a raw native listener before concluding it wasn't
`audit_started`'s React `onFocus` handler at fault. Real user
interaction bubbles normally; this only affects automated testing of
focus-triggered events in this tool.

### ADR-008: Showcase system — data model, one card component, review architecture deferred

Date: 2026-09-05
Status: accepted

Context: The showcase-system brief asked for `/showcases` and
`/showcases/[slug]` built to an exact data model (name, industry,
location, websiteUrl, description, problem, solution, services, review/
reviewAuthor/reviewRole/reviewRating, screenshots, featuredImage,
launchDate, featured, metrics), explicit anti-fabrication rules, SEO
structured content, and a review-system architecture that supports
future request/approve/associate/display/link workflows without
building a customer dashboard or automated collection now.

The homepage build (ADR-007) had already shipped a narrower, ad hoc
shape (`business`/`category`/`city`/`liveUrl`/`outcome`) rendered by a
single `ShowcaseProofCard` that combined everything into one homepage
tile, plus an unused `CaseStudyCard` demonstrated only in
`/design-system`. Neither matched the brief's full data model, and
having a homepage-only card and a generic-but-thin index-page card
(`ShowcaseCard`, previously title/description only) meant the same real
client data was modeled two different ways in two different places.

Decision:
1. Centralized the data model and all filtering logic in a new
   `lib/showcases.ts` (same justification as ADR-002's `lib/content.ts`
   addition) — `ShowcaseFrontmatter` matches the brief's field list
   exactly, and `isPublishable()` gates every listing and detail lookup
   on the four fields a page can't honestly render without
   (name/industry/websiteUrl/description), rather than each page
   re-implementing that check or relying on a hardcoded slug exclusion
   (the homepage previously filtered out `example-showcase` by name —
   fragile, and it wouldn't have scaled to a second placeholder).
2. Retired `ShowcaseProofCard` and `CaseStudyCard` in favor of one
   `ShowcaseCard` used by both `/showcases` and the homepage's Showcases
   section. The brief specifies exactly what a showcase grid card shows
   (business, industry, image, short description, review excerpt if
   available, CTA) — that's a link into the detail page, which now
   carries the full proof (problem, solution, services, review, metrics,
   live link), not a second place for the same proof to live.
3. Deleted `content/showcases/example-showcase.mdx`. It predated the
   real client entries and its own body text claimed they were "not
   reproduced here" — false since ADR-007. It no longer satisfies
   `ShowcaseFrontmatter`'s required fields either. `/design-system`'s
   `ShowcaseCard` demo now uses an inline example object (same pattern
   already used for `Testimonial`/`Review` there) instead of reading a
   content file, so no example data flows through the real content
   pipeline.
4. Rewrote the three real entries' frontmatter to the new field names.
   No new facts were added beyond what `legacy/5000-setup.html` and
   `docs/forge-business-rules.md` §6 already established: `services` is
   the ₹5,000 (Launch) tier's real, sourced `included` list personalized
   per client (all three are documented Launch-tier builds); `problem`/
   `solution` restate the same GBP-to-website narrative already in each
   file's body, just promoted to structured fields; Smile Care's 4.9★/82
   reviews and We Health Care's "booked in 47 minutes" moved into
   `metrics` (real, sourced numbers) rather than `reviewRating` — neither
   is a quoted, attributed review, so modeling them as one would imply a
   named customer said something no one is on record saying. No
   `review`/`reviewAuthor`/`screenshots`/`featuredImage` exists for any
   of the three; those fields are simply absent, not stubbed.
5. Review-system architecture: `review`, `reviewAuthor`, `reviewRole`,
   `reviewRating` are four independent optional frontmatter fields,
   deliberately shaped so a future `reviews` collection (keyed by
   customer + showcase slug, with a `status: pending | approved` field)
   could populate exactly these fields later without a rename. No
   request/approval workflow, storage, or dashboard was built — the
   brief explicitly excluded that, and nothing today needs it.
6. Wired `showcase_viewed` (defined in the taxonomy since the homepage
   build, left unwired per ADR-007's own note) via a new, minimal
   `ShowcaseViewTracker` client component — the one Client Component
   this system needs; both the index and detail pages otherwise remain
   Server Components.

Consequences: Adding a 4th showcase means adding one `.mdx` file with
the required fields — no component or page changes, satisfying "scale
to hundreds without changing page implementation." Pagination for
`/showcases` was not built; with 3 real entries, building it now would
be speculative. The formal review-request/approval workflow (asking a
customer for a review, routing it for approval) remains unbuilt by
design — see item 5 — and should be designed for real once Human
Decision #7 (testimonial consent policy, `docs/forge-business-rules.md`
§15) is resolved.

### ADR-009: Forge Free Audit rebuilt as a self-serve interactive tool

Date: 2026-09-05
Status: accepted

Context: The brief asked for `/audit` to become a full system —
landing → input → processing → result → recommendation → CTA — evaluating
nine named categories (business information, website presence,
contactability, reviews, service clarity, mobile experience, online
credibility, local discoverability, conversion friction), explicitly
requiring that if no live API integration is available, a truthful
fallback input flow be designed instead, that the result never be a bare
score, and that the score never be deliberately deflated to sell Forge.
It also specified exact CRM fields (captured only when a lead is
"identifiable" — name/email/phone voluntary) and five analytics events
(`audit_started`, `audit_submitted`, `audit_completed`,
`audit_result_viewed`, `audit_cta_clicked`).

There is no Google Business Profile API credential anywhere in this repo
(confirmed — no `.env`, docs/session-handoff.md). The previous `/audit`
page (`components/audit/AuditForm.tsx` embedded directly) was a single
contact-form gate: submit identity + GBP link, wait up to 48 hours for a
human-written write-up — this matches `docs/forge-business-rules.md` §5's
description of the *legacy* 7-point manual audit exactly, and that
description is correct and untouched. This system replaces that flow at
the `/audit` route with something categorically different: instant,
self-serve, no identity required to see a real result.

Decision:
1. Built a 9-question self-report questionnaire
   (`lib/audit.ts` `AUDIT_CATEGORIES`) as the truthful fallback for the
   missing live API — each question's three options are tagged
   `strong`/`weak`/`missing`; nothing about a specific business is ever
   looked up or invented, only what the visitor told us.
2. `computeAuditResult()` is a pure function — deterministic, no
   weighting, no randomness — the concrete mechanism behind "do not
   deliberately make the score artificially poor to sell Forge." No
   single numeric score is ever shown, per the brief.
3. Recommendation logic is three fixed branches (no website → Launch;
   has a website but another gap is worse → Growth; everything strong →
   Maintenance), using live pricing from `lib/constants.ts` rather than
   hard-coded numbers.
4. `lib/crm.ts` `Lead.email` widened from required to optional (a new
   doc comment explains why); `location?: string` added; `LeadStage`
   gained `'audit-lead'`, wiring the stage `docs/conversion-architecture.md`
   §5 already named but that the code had never actually set. A new,
   separate Server Action (`submitAuditLeadAction`, `app/actions.ts`)
   requires *either* email or WhatsApp, never both, rather than reusing
   `submitLeadAction`'s hard email requirement — every other existing
   form's validation is unchanged.
5. Added the three events the taxonomy was missing
   (`audit_submitted`, `audit_result_viewed`, `audit_cta_clicked`) to
   `lib/analytics.ts`. **`audit_completed` changes meaning**:
   `docs/conversion-architecture.md` §7 originally defined it as a
   backend/CRM event fired when a human at Forge finishes a manual
   write-up — that delivery model no longer exists for this route, so
   there's nothing left for that definition to describe. It now means
   "the client-side computation finished and a result is ready to
   render," a client event like every other one in the file. The doc
   table has been updated to match; this is flagged explicitly rather
   than silently reinterpreted, since it's a real change in what the
   event name means, not just an implementation detail.
6. `components/audit/AuditForm.tsx` (the old embedded contact form) is
   untouched and still used on the homepage and `/design-system` — this
   decision only replaces what `/audit` itself renders.

Consequences: A visitor gets a real, honest result without giving any
contact information — the CRM is only touched once, optionally, at the
very end. This is a genuine product redesign, not a bug fix or a
migration of existing behavior — `docs/forge-business-rules.md` is
correctly left unchanged (it describes the legacy 7-point manual process,
which still happened, on the old page, at some point in the past); this
ADR and `docs/architecture.md` "The audit tool system" are where the new
reality lives. Verified live in a browser (desktop 1280px and mobile
375px): full input → processing → result flow, all three recommendation
branches (missing/mixed/all-strong), the lead-capture form's validation
error (neither email nor WhatsApp given) and success path end-to-end
through to `lib/crm.ts`'s console provider (lead captured, stage set to
`audit-lead`, event tracked), the CTA click event, and all five required
analytics events firing with correct payloads, in order, exactly once
each. `npm run typecheck` / `lint` / `build` all pass (18/18 static
pages). One pre-existing, unrelated issue was noticed and left alone
(out of scope for this change): `buildMetadata()`
(`lib/seo.ts`) already appends `" — Forge"` to every page title, and
`app/layout.tsx`'s title template appends it again, producing
"Page — Forge — Forge" site-wide — this predates this session and
affects every route, not something introduced here.

### ADR-010: CRM rebuilt as a full adapter — Lead model, 17-stage lifecycle, dedup/rate-limiting/graceful degradation

Date: 2026-09-06
Status: accepted

Context: The brief asked for a formal CRM integration architecture: the
site must not be tightly coupled to one provider; a `CrmAdapter` with six
exact operations (`createLead`/`updateLead`/`addLeadEvent`/
`updateLeadStage`/`addLeadTag`/`getLeadStatus`); an expanded Lead model
(20 named fields); the full 17-stage lifecycle, verbatim; a 9-event
taxonomy; explicit data-quality requirements (dedup, malformed
email/URL, spam, accidental duplicate submissions); security
requirements (no client-side credentials, rate limiting); observability
(no unnecessary PII in logs); and graceful degradation (a CRM outage must
not make the site unusable) — plus `docs/crm.md`.

The prior `lib/crm.ts` (built across ADR-006/ADR-009) already had the
right shape in miniature — a provider interface, console/webhook/hubspot
implementations, a `LeadStage` type — but a much smaller surface
(`captureLead`/`trackLeadEvent`/`updateLeadStage`, a 6-value `LeadStage`
union, an 11-field `Lead`). This is a genuine expansion of that same
architecture, not a rewrite of its philosophy.

Decision:
1. Renamed/expanded the adapter to the six exact required operations
   (`CrmAdapter` interface, `lib/crm.ts`). Every top-level export wraps
   its provider call in `try/catch` and resolves to `{ ok: false, error }`
   on any failure — new behavior; the old code let a provider's throw
   propagate unhandled, which the brief's "must fail gracefully" and
   "must not become unusable" requirements call out directly. This also
   made the `hubspot` stub finally safe to select without crashing a page.
2. `Lead` gained the brief's full field list (`campaign`, `utmSource`,
   `utmMedium`, `utmCampaign`, `landingPage`, `businessName`,
   `businessUrl`, `industry`, `location`, `contactName`, `phone`,
   `auditScore`, `auditStatus`, `currentStage`, `createdAt`, `updatedAt`,
   `lastActivityAt`), renamed at the CRM boundary only (`business`→
   `businessName`, `googleProfileUrl`→`businessUrl`, `category`→
   `industry`, `whatsapp`→`phone`, `name`→`contactName`) — no form
   component's field names changed, only the mapping inside
   `app/actions.ts`. `message` (never actually set by any current form)
   was dropped to match the brief's closed field list. One field was
   added beyond that list: `tags: string[]`, because `addLeadTag()` — a
   required operation — needs somewhere to persist what it adds; flagged
   explicitly in `docs/crm.md` rather than silently extended.
3. `LeadStage` replaced entirely with the brief's 17-stage list, verbatim
   (previously a 6-value ad hoc union: `'new'|'audit-lead'|'contacted'|
   'qualified'|'proposal'|'won'|'lost'`). `docs/conversion-architecture.md`
   §5's older 13-stage sketch is now marked superseded rather than
   rewritten in place (its narrative/rationale is still accurate; only
   the stage *names* changed) — same append-don't-rewrite convention this
   log has followed since ADR-008.
4. Data quality: `lib/validation.ts` (new; `isValidEmail`/`normalizeUrl`,
   used by both Server Actions and the audit tool's client form — the
   two previously had separate, drifting implementations).
   `lib/rate-limit.ts` (new; in-memory fixed-window, 5 per 10 minutes per
   IP-ish key, honestly documented as single-process). A client-generated
   `submissionId` (one per form mount, `crypto.randomUUID()`) is threaded
   through both lead forms and recognized by the console provider's
   `createLead()` to collapse a retried/double submission into the
   existing lead instead of creating a duplicate. The console provider
   also dedupes by normalized email within a 30-day window. Neither
   dedup mechanism is a new adapter method — both live inside
   `createLead()`'s own implementation, keeping the adapter's public
   shape exactly the six specified operations.
5. Security: `lib/rate-limit.ts` added `import 'server-only'` (matching
   `lib/crm.ts`); the webhook provider now sends `Authorization: Bearer
   ${CRM_WEBHOOK_SECRET}` when that env var is set (name only — no value
   invented, none exists in this repo, matching every other credential in
   this project).
6. Graceful degradation: the webhook provider now has a hard 5-second
   timeout via `AbortController` — without it, a slow/unreachable CRM
   endpoint could hang a Server Action indefinitely (the submit button
   stays disabled while pending), which would make the *form* unusable
   even with the try/catch from item 1 in place, since nothing would
   have failed yet to catch.
7. Observability: `safeLogFields()` — every console log about a lead
   (success or failure, both providers) is restricted to
   `{ leadId, source, currentStage, hasEmail, hasPhone }`. The previous
   console provider logged the entire lead object, email/phone/name
   included, directly to the server console — a real, if low-stakes, PII
   overexposure this replaces.
8. `docs/crm.md` written as the authoritative architecture/lifecycle
   reference. `docs/conversion-architecture.md` §5 and §6 got short
   superseding notes pointing to it rather than being rewritten, per the
   living-document convention this project already follows.

Consequences: `app/actions.ts`'s two Server Actions were rewritten to the
new API (mapping old form field names to the new Lead field names at the
boundary, adding rate-limit checks, adding referer-derived UTM/landing-page
attribution for the generic embedded form, which previously had none).
`components/forms/useLeadForm.ts` and
`components/audit/AuditLeadCaptureForm.tsx` both gained a `submissionId`
hidden field; `components/audit/AuditInputForm.tsx` now imports
`normalizeUrl` from `lib/validation.ts` instead of a local duplicate.
No page or component outside these needed to change.
`npm run typecheck`/`lint`/`build` all pass (18/18 static pages).
Several events in the new 9-event taxonomy
(`pricing_viewed`/`pricing_plan_viewed`/`showcase_viewed`/
`whatsapp_clicked`/`call_clicked`/`contact_clicked`) have no current
`addLeadEvent()` call site — stated as a known limitation in
`docs/crm.md` rather than force-wired without a `leadId` to attach them
to (this codebase has no persistent per-visitor lead identity yet; see
`docs/crm.md` §6 and §11). Everything else in the brief is implemented
and documented, not deferred.

### ADR-011: Commercial ladder set directly by the business owner — ₹5,000/₹15,000/₹25,000 (Launch/Growth/Pro), resolving HD#1 and HD#2

Date: 2026-09-06
Status: accepted

Context: `docs/forge-business-rules.md` had left two Human Decisions
open since the baseline audit: HD#1 (which of the conflicting legacy
funnels — ₹9,999→₹24,999 on `index.html`, or ₹5,000→₹15,000→₹30,000 on
`5000-setup.html` — is canonical) and HD#2 (no ₹25,000 product exists at
any price point in the legacy source; the nearest figures are ₹24,999
and ₹30,000). `docs/conversion-architecture.md` had only adopted
`Free Audit → ₹5,000 Website` as a working assumption for planning, not
a resolution. The business owner then gave a direct, explicit commercial
brief in chat: build `/websites`, `/websites/5000`, `/websites/15000`,
`/websites/25000`, and `/maintenance` on a final ₹5,000/₹15,000/₹25,000
ladder (Launch/Growth/Pro), with an explicit instruction that the three
tiers represent genuinely different levels of business value — not the
same product with items added to justify a higher number — plus required
pricing-psychology properties (anchoring, differentiation, transparent
scope, comparison, risk reduction, proof; no fake urgency/stock/slots).

Decision:
1. Treated this as the business owner directly resolving HD#1 and HD#2
   — logged here rather than silently overwriting the open items in
   `forge-business-rules.md` (which now carry an explicit resolution
   note pointing back to this ADR, per the project's standing convention
   for how a Human Decision gets marked resolved).
2. `lib/constants.ts` `WEBSITE_TIERS` rewritten: all three tiers now
   `status: 'confirmed'` (the ₹25,000 tier is no longer `price: null` /
   pending). Each tier gained `bestFor`, `whoItsFor`, `ownership`,
   `support`, and `process` fields — the existing `included`/`excluded`/
   `deliveryTime`/`revisionPolicy` fields were kept, not replaced — so
   every tier page can render what you get, what you don't get, who
   it's for, the process, timeline, ownership, and support without
   inventing structure per-page.
3. Differentiation is built on build complexity and process, not feature
   padding: Launch is the same proven layout for everyone, one page, no
   revisions, pay only after seeing it live; Growth is a custom design
   and custom copy, up to 3 pages, one structured revision round; Pro
   adds a conversion engine (service picker / booking-request form /
   quote wizard), up to 8 pages, two revision rounds, and a bundled first
   month of Active maintenance. Support windows (14/30/60 days) and
   delivery times (same-day / 2–4 days / 5–7 days) scale with the same
   logic. No page count, revision count, or delivery time here has a
   legacy source — they are new, business-owner-set numbers, cited as
   such in each tier's `sourceNote` rather than attributed to the legacy
   codebase.
4. `components/pricing/WebsiteTierPage.tsx` rewritten to render all
   required sections in order (what you get / what you don't get / who
   it's for / process / timeline, ownership & support / CTA), with a CTA
   at both top and bottom. `components/pricing/PriceCard.tsx` gained a
   "Best for" line for differentiation on the grid. New
   `components/pricing/PricingComparisonTable.tsx` renders a full
   side-by-side comparison on `/websites` (the "comparison" pricing-
   psychology requirement) — every cell reads from `lib/constants.ts`,
   nothing hard-coded in the table itself.
5. `/websites` also gained a `TrustSignals` block (risk reduction: pay-
   only-when-sure on Launch, ownership guarantee, transparent scope) and
   a real-showcases section (`getFeaturedShowcases(3)` — proof), reusing
   existing components rather than building new ones.
6. `/maintenance`: prices and the three-tier structure are unchanged
   (HD#3 — the conflicting ₹1,999/mo flat-rate legacy mention — remains
   open; this session did not touch it). Only the framing changed:
   taglines and hero copy now read as ongoing technical care and
   improvement, not merely hosting, per the brief. Added
   `MAINTENANCE_EXCLUSIONS` (sourced from `operator.html` "Not included",
   already documented in `forge-business-rules.md` §9) rendered on the
   page for transparency — this was previously documented but not shown.
7. No fabricated urgency, stock, or countdown was added anywhere in this
   pass — `CapacityStrip`'s `'tbd'`-gated silence (untouched) remains the
   only capacity-adjacent UI on the site.

Consequences: The ₹25,000 tier is no longer a pending-confirmation
placeholder — `/websites/25000` now renders full content like the other
two tiers. HD#3 (maintenance pricing conflict), HD#4 (revision policy
across tiers — now more resolved in spirit by this session's explicit
per-tier revision counts, though the legacy zero/one/two conflict this
HD originally described is a separate, still-open question about the
*old* ladder), and the other Human Decisions not addressed here remain
open. `npm run typecheck`/`lint`/`build` all pass (18/18 static pages);
`/websites`, `/websites/5000`, `/websites/15000`, `/websites/25000`, and
`/maintenance` were verified live in a browser, desktop and mobile
(375px) viewports, including the comparison table's horizontal-scroll
behavior on narrow screens.

### ADR-012: Post-sale growth architecture — reviews, showcase eligibility, referrals

Date: 2026-09-06
Status: accepted

Note on numbering: this is ADR-012, not ADR-011. While this session's
work was in progress, `lib/constants.ts` and `components/pricing/PriceCard.tsx`
were updated on disk by what appears to be a separate, concurrent session
resolving `forge-business-rules.md` Human Decisions #1/#2 (the pricing
ladder) — its own comment in `lib/constants.ts` already cites "ADR-011"
for that work, not yet written to this file as of this entry. This
session did not touch that work and left it exactly as found; skipping
to ADR-012 here avoids a collision once that ADR is written. If ADR-011
never materializes, that's a gap to close, not a number to reuse.

Context: The brief asked for the architecture behind Customer → Success
→ Review → Showcase → Referral → New Customer: a real review-collection
model (with three independent, explicit consents — Forge website,
showcase, marketing material), showcase-candidate eligibility built on
top of it, and a referral system (unique identifier, URL, attribution,
status, successful-referral detection, reward status) that supports a
future customer dashboard without building one now. Two constraints were
explicit and load-bearing: the ₹5,000 tier's delivery must never depend
on referrals, and nothing about the referral mechanism should read as
disguised payment or use manipulative language. A third — no monetary
reward may be invented, only a configurable shape for one — ties directly
to `forge-business-rules.md` HD#6 ("Whether to build a referral program,
and its mechanics — nothing currently exists to base a decision on"),
still open.

Decision:
1. Two new lib files, `lib/reviews.ts` and `lib/referrals.ts`, both
   built on top of the existing six-operation `CrmAdapter`
   (`lib/crm.ts`) rather than extending it — neither review-collection
   nor referral tracking needed a new adapter operation once composed
   from `updateLead`/`updateLeadStage`/`addLeadTag`/`addLeadEvent`/
   `getLeadStatus`. Same reasoning as ADR-010's dedup logic living
   inside `createLead()` rather than becoming a seventh operation.
2. Both files gate on `getLeadStatus()` against a fixed stage set
   (`POST_DELIVERY_STAGES` in `lib/reviews.ts`, `CAN_REFER_STAGES` in
   `lib/referrals.ts`) before doing anything — `requestReview()`,
   `checkShowcaseEligibility()`, and `createReferralCode()` all refuse
   before a real delivery, at the data layer, not just as documented
   intent. This is also what makes "delivery never depends on referrals"
   true in both directions: delivery doesn't check either module, and
   both modules refuse to function without delivery already having
   happened.
3. `ReviewConsent` is three independent booleans
   (`website`/`showcase`/`marketing`), none defaulting to true,
   settable independently later via `updateReviewConsent()` — matching
   the brief's three named uses exactly and the existing house rule that
   showcase consent is never implied by a review at all
   (`forge-business-rules.md` §16, HD#8, `ADR-008`).
4. `checkShowcaseEligibility()`/`markShowcaseCandidate()` only ever
   touch the CRM lead's stage. They have no knowledge of
   `content/showcases/*.mdx` and don't publish anything — actual
   publishing stays the deliberate manual `.mdx`-authoring step
   `ADR-008` already established. This keeps "who's eligible to be
   asked" (new, this ADR) cleanly separate from "what's actually live"
   (existing, unchanged).
5. Referral architecture: `ReferralCode` (unique code + URL, one per
   customer, idempotent to (re)request), `ReferralAttribution`
   (per referred lead: status `'lead-created'|'qualified'|'converted'`,
   reward status). `RewardStatus` is `'tbd' | 'pending' | 'not-applicable'`
   — never a number, never a currency — and `REFERRAL_REWARD_CONFIG`
   (`lib/constants.ts`) is `{ rewardType: null, rewardValue: null,
   status: 'tbd' }`, the same null/'tbd' pattern already used for
   `SITE.whatsappNumber` and the ₹25,000 tier before it was resolved.
   `markReferralConverted()` only ever sets `rewardStatus: 'pending'`
   once `REFERRAL_REWARD_CONFIG.status` is `'confirmed'` — until then it
   stays `'tbd'`, so nothing in this codebase can accidentally promise a
   reward that doesn't exist yet.
6. `app/r/[code]/route.ts` — a Route Handler, not a page, specifically
   because setting the attribution cookie before redirecting isn't
   possible from a Server Component during render. Always redirects to
   `/audit` regardless of whether the code resolves; an unrecognized
   code degrades to "no attribution," never a dead end, matching the
   graceful-degradation standard `ADR-010` set for CRM outages, applied
   here to a bad/expired link instead.
7. `lib/crm.ts` gained `Lead.referredByCode` (optional, same pattern as
   `tags` in ADR-010) and two `LeadEventName` values,
   `referral_lead`/`referral_conversion` — both fire against a real
   `leadId`. `referral_click` deliberately isn't one of them: a click has
   no lead yet, so it's tracked as a plain counter on the `ReferralCode`
   record instead, not forced into `addLeadEvent()`.
8. `app/actions.ts` reads the `forge_ref` cookie server-side
   (`cookies()`, never a client-supplied field) and calls
   `attributeReferralLead()` once, only for a genuinely new
   (`!result.deduped`) lead — an existing customer's later visit is
   never misattributed as a fresh referral.
9. No manipulative-language risk was introduced because no
   customer-facing referral copy was written at all — the brief said not
   to build the dashboard yet, and the redirect itself is invisible.
   Documented as a standing constraint for whoever builds that dashboard
   next (`docs/architecture.md` "Post-sale growth architecture"), not
   solved by writing careful copy that doesn't exist yet.

Consequences: `npm run typecheck`/`lint`/`build` all pass (18/18 static
pages, `/r/[code]` now listed as a dynamic route). Deliberately not
built, matching the brief: a customer-facing referral dashboard, a
review-submission page (the brief didn't name one the way it named
`/r/[code]`; `lib/reviews.ts` is ready for one), and any automatic
purchase → `'customer'` trigger (no payment processing exists in this
codebase — `docs/architecture.md` "Out of scope" — so `markReferralConverted()`
and every post-`'audit-lead'` stage transition remain manual/ops-triggered,
unchanged from `ADR-010`). Both new stores are in-memory and
single-process, the same stated limitation as `lib/crm.ts`'s console
provider (`docs/crm.md` "Known limitations") — real durability needs a
real store, not invented here for the same reason one wasn't invented
for leads.

### ADR-013: In-memory Maps replaced with a file-backed store — a real cross-boundary bug found while testing ADR-012

Date: 2026-09-06
Status: accepted

Context: While verifying ADR-012's referral flow live (not just by a
green build — see this project's standing verification convention since
ADR-004/ADR-007), the actual attribution step failed:
`attributeReferralLead()` returned `"unknown referral code"` for a code
that had just been created and confirmed resolvable seconds earlier via
`resolveReferralCode()`. Debug logging traced the cause precisely: the
code was created inside a Route Handler (`app/r/[code]/route.ts`, or the
scratch verification route standing in for a future admin action), and
`attributeReferralLead()` runs inside a Server Action
(`app/actions.ts`). Both import the same `lib/referrals.ts` module and
both run inside the same long-running `next start` process — and still
did not see the same data. Confirmed directly against a real production
build (`next build` + `next start` on a separate port, not `next dev`,
which has its own on-demand-compilation quirks that would have muddied
the diagnosis): a plain `const codes = new Map()` at module scope in
`lib/referrals.ts` gets a **separate instantiation per Next.js bundle** —
Route Handlers and Server Actions are compiled into different bundles
even when they import the identical source file, so each gets its own
copy of that module's top-level state. Two Route Handlers calling into
the same module happened to share state correctly in a separate test
(apparently bundled together); a Route Handler and a Server Action did
not.

This is a framework-level characteristic, not a bug in the referral
logic itself — but it meant `lib/crm.ts`'s console provider
(`ADR-010`), `lib/referrals.ts`, and `lib/reviews.ts` (both `ADR-012`)
all had the identical latent defect: any flow requiring a Route Handler
and a Server Action (or two independently-bundled Route Handlers, in the
general case — the one successful cross-route test in ADR-012's
verification may simply have gotten lucky on bundling, not proof of a
guarantee) to see the same lead/referral/review data would silently
fail. This had gone undetected through ADR-010's verification because
every test there happened to call all six CRM operations from within a
single scratch Route Handler — never actually crossing the boundary a
real deployment (Route Handler creates a code, Server Action attributes
it) requires.

Decision: Added `lib/file-store.ts` — a minimal JSON-file read/write
helper (`.data/*.json`, `fs.readFileSync`/`writeFileSync`, whole-file,
no locking) — and moved all three affected modules onto it:
1. `lib/crm.ts`'s console provider: `store`/`bySubmissionId`/`byEmail`
   Maps replaced with `.data/leads.json` (keyed by leadId) and
   `.data/lead-submissions.json` (submissionId → leadId); email dedup
   now scans `Object.values()` of the loaded file instead of a separate
   index Map.
2. `lib/referrals.ts`: `codes`/`byReferrer`/`attributions` Maps replaced
   with `.data/referral-codes.json` and `.data/referral-attributions.json`.
3. `lib/reviews.ts`: `reviewsByLead` Map replaced with `.data/reviews.json`.
4. `.data/` added to `.gitignore` (contains lead PII in local dev).
5. `lib/rate-limit.ts` was **not** changed — every current call site is
   inside `app/actions.ts`'s Server Actions (the same bundle calling
   itself), so it doesn't exhibit this bug today. Its doc comment now
   flags the same risk explicitly for whoever adds a Route Handler that
   needs rate limiting later, rather than leaving the next person to
   rediscover this the same way.

A file-backed store fixes the actual bug because filesystem I/O goes
through the OS, which every execution context in the same
process/container shares regardless of which JS bundle is running —
sidestepping the module-instantiation problem entirely rather than
working around it. This is still not a real database (no locking, no
concurrent-write safety, no query capability beyond loading the whole
file) — an explicit, deliberate choice consistent with "no database
exists in this project" (`docs/architecture.md` "Why no CMS"), just a
version of "no database" that is actually correct for this framework
instead of one that looked correct in every test that didn't cross a
bundle boundary.

Consequences: Re-verified the full ADR-012 flow end-to-end against a
real production server on this fix — referral code creation, `/r/[code]`
resolution and click counting, cookie-based attribution from within the
Server Action, `referral_lead` firing against the newly-created lead,
`Lead.referredByCode` persisting, and `markReferralConverted()` correctly
tagging and re-staging the referrer to `'referral-partner'` — all
confirmed working across the Route-Handler/Server-Action boundary this
time. `npm run typecheck`/`lint`/`build` all pass. Docs updated:
`docs/crm.md` §1 and §11 no longer describe the console provider as a
bare in-memory Map. This ADR is also a note to future sessions: a
scratch verification route that only calls a module from within itself
proves far less than it looks like it proves — the meaningful test is
whichever two execution contexts a real flow actually needs to agree
with each other.

### ADR-014: Blog and resource system — `/blog`, `/blog/[slug]`, topic clusters, full SEO surface

Date: 2026-09-06
Status: accepted

Context: The brief asked for a real content system, not URL-filling: MDX
posts with title/slug/description/date/author/category/tags/featuredImage,
scoped to nine named topic clusters (Google Business Profile, Local SEO,
Business websites, Online credibility, Reviews, Website conversion, Lead
generation, Local marketing, Digital presence); the full SEO surface
(metadata, canonical, OpenGraph, Twitter/X, sitemap, robots.txt,
structured data, breadcrumbs, semantic headings, internal linking,
optimized images); and six named reusable components (BlogCard,
ArticleHeader, ArticleBody, RelatedArticles, ArticleCTA,
TableOfContents), with new content addable without touching application
code. It also explicitly asked for `article → relevant tool → audit →
Forge`, not `article → "BUY NOW"`.

The prior `/blog` (from the original Next.js scaffold, ADR-001) was
one placeholder post proving the MDX pipeline worked, nothing more —
`content/blog/hello-world.mdx` said so in its own body text.

Decision:
1. `lib/blog.ts` — new domain layer on top of `lib/content.ts`, same
   justification as `lib/showcases.ts` (ADR-002/ADR-008). `BLOG_CATEGORIES`
   is the closed nine-cluster list from the brief, typed as
   `BlogFrontmatter['category']` rather than a free-text field, so
   `/blog`'s category filter and every internal link to a category can't
   drift into an ad hoc taxonomy over time. `isPublishable()` gates on
   title/description/date/author/a valid category — tags and
   `featuredImage` stay optional and unrendered when absent, the same
   "no field defaulted to a placeholder" rule as showcases.
2. **Internal linking, not decoration.** `getRelatedPosts()` scores other
   posts by shared category (weighted 2) then shared tags (weighted 1),
   falling back to recent posts so the section is never empty once a
   second post exists — this is what `RelatedArticles` renders. Every
   real article written this session also links inline to at least one
   other post, a relevant pricing tier, or a showcase — internal linking
   built into the content, not just the template.
3. **`article → relevant tool → audit → Forge`, not `article → "BUY NOW"`:**
   `ArticleCTA` wraps the existing `CTA` band (same FAQ-wraps-Accordion
   pattern already in the codebase) with the audit as the one constant
   primary action (relevant to every visitor regardless of topic) and an
   optional secondary link. `BlogFrontmatter.ctaHref`/`ctaLabel` let a
   post point that secondary link at whatever's actually relevant to its
   topic — a showcase, a specific website tier — set entirely through
   frontmatter, so a new post's CTA never requires a component change.
4. **Table of contents without new client JS.** `lib/blog.ts`
   `extractHeadings()` regexes `##`/`###` out of the raw MDX for
   `TableOfContents` (a plain server-rendered nav); `ArticleBody` maps
   `h2`/`h3` through a component that computes the same id via the same
   `slugify()` at render time, so the two never need to share one parse
   pass to agree — documented as a deliberate heuristic, not a full MDX
   parse, in both places.
5. **Optimized images**, both places a post can carry one: `BlogCard`
   and `ArticleHeader` render `featuredImage` through `next/image`
   (`fill` + `sizes`, unlike the showcase system's deliberate CSS-
   background choice — showcases anticipate an arbitrary future client
   domain, blog images are first-party and load-bearing enough to want
   real optimization). In-body markdown images route through `next/image`
   too, via `ArticleBody`'s `img` component override, inside a fixed
   `aspect-video` frame since markdown gives no explicit dimensions.
   No `featuredImage` was invented for the three real posts shipped this
   session — the field renders nothing when absent, same convention as
   every other optional field in this codebase.
6. **Full SEO surface:**
   - `lib/seo.ts` `buildMetadata()` gained `type: 'article'` (adds
     OpenGraph article tags: `publishedTime`, `authors`) — every other
     caller is unaffected, `type` defaults to `'website'`.
   - `lib/seo.ts` `buildBreadcrumbJsonLd()` + new
     `components/marketing/Breadcrumbs.tsx` render the same `items` as
     both the visible trail and the `BreadcrumbList` structured data, on
     both `/blog` and `/blog/[slug]` — reusable beyond the blog wherever
     a future page needs breadcrumbs.
   - `/blog/[slug]` emits `BlogPosting` structured data, same
     "every field a direct copy of real frontmatter" rule ADR-008 set
     for showcases' `CreativeWork` block.
   - `app/sitemap.ts` and `app/robots.ts` — the App Router's native
     `MetadataRoute` files (served at `/sitemap.xml`/`/robots.txt`, no
     hand-written XML template). The sitemap reads from the same
     `getAllShowcases()`/`getAllPosts()`/`WEBSITE_TIERS` every page
     already renders from, so a new showcase or post appears in it the
     moment its content file exists. `/design-system` is excluded via
     its existing page-level `noindex` (not a robots.txt disallow —
     disallowing it would stop a crawler from ever seeing that noindex
     tag). `/r/[code]` and `/api/*` are disallowed in robots.txt as
     non-content utility routes.
7. **Content additions need no architecture change**, same guarantee
   ADR-008 established for showcases: a new post is one `.mdx` file with
   the required frontmatter — `generateStaticParams` in
   `app/blog/[slug]/page.tsx` comes from `getAllPosts()`, no slug is
   hard-coded anywhere, and the category filter on `/blog` is driven by
   `BLOG_CATEGORIES`, not a per-category page.
8. **Real content, not placeholders.** `content/blog/hello-world.mdx`
   was deleted (its own body said to, once real content existed — same
   precedent as `example-showcase.mdx` in ADR-008) and replaced with
   three real, substantive articles across three different topic
   clusters (Google Business Profile, Online credibility, Website
   conversion), each answering a specific question a visitor would
   actually search for rather than filling a URL — matching the brief's
   explicit "do not create thin SEO pages" instruction. No fabricated
   statistic, testimonial, or claim appears in any of them, per the
   standing `forge-business-rules.md` §18 rule.
9. `blog_viewed` (defined in the analytics taxonomy, unwired since the
   original scaffold) is now wired via `BlogViewTracker`, the same
   one-Client-Component pattern `ShowcaseViewTracker` set in ADR-008.

Consequences: `npm run typecheck`/`lint`/`build` all pass (22/22 pages —
18 from before, 3 real posts via `generateStaticParams`, plus
`/sitemap.xml` and `/robots.txt`). Verified live in a browser: category
filtering on `/blog`, an article's breadcrumbs/header/body/TOC/related
articles/CTA end to end, TOC anchor ids matching rendered heading ids
exactly, canonical/OpenGraph(`article`)/Twitter meta and both
`BlogPosting`/`BreadcrumbList` JSON-LD blocks present, and
`/sitemap.xml`/`/robots.txt` both resolving correctly against
`SITE.marketingUrl`. `app/design-system/page.tsx`'s `BlogCard` demo
now uses an inline example object instead of reading
`content/blog/hello-world.mdx` (which no longer exists) — same fix
ADR-008 already made for `ShowcaseCard`'s demo, applied here for the
same reason. See ADR-015 for a real, site-wide button-contrast bug this
session found and fixed while building `ArticleCTA`.

### ADR-015: Fixed a site-wide bug — `text-color` utilities silently dropped when combined with Forge's custom `text-{size}` scale

Date: 2026-09-06
Status: accepted

Context: Building `ArticleCTA`'s primary button (`Button` `variant="onDark"`
`size="lg"`) surfaced invisible button text in a live browser check —
`getComputedStyle` showed the button's text color exactly equal to its
own background color. Root cause, traced into `tailwind-merge`'s
default class-group config (`node_modules/tailwind-merge`): its
`text-color` group matches `text-{anything}` against the project's
configured Tailwind theme colors, and when `tailwind-merge` isn't given
that theme (the case here — `lib/utils.ts` `cn()` called plain
`twMerge()` with no config), its default color validator falls back to
matching *any* value. Forge's named type scale
(`lib/design-tokens.ts` `fontSize` — `text-body`, `text-heading-lg`,
etc., ADR-005) doesn't match `tailwind-merge`'s built-in font-size
patterns (standard t-shirt sizes or arbitrary-length syntax only), so
every one of those custom size classes was *also* being classified as a
text-color utility. `Button`'s `cn(base, variants[variant], sizes[size],
className)` call order meant the real text color
(`variants.onDark`'s `text-ground`) always lost to whichever size class
came after it (`sizes.lg`'s `text-body`) — confirmed by reproducing it
standalone against the installed `tailwind-merge` before touching any
source (`twMerge('text-ground', 'text-body')` → `'text-body'`, the
color silently gone).

This is not new-in-this-session breakage. `Button`'s `onDark`/
`onDarkSecondary` variants have always been paired with a `size`, so
every existing use of them — the showcase page's "Visit the live site"
button, `TrackedCtaLink` wherever it's used with those variants — was
already affected. It simply had no live-browser check exercise it after
the fact until this session's audit-tool/pricing work (which use
`onDark` on their own dark CTA bands) happened not to trip it, and this
session's blog work did.

Decision: `lib/utils.ts` `cn()` now uses `extendTailwindMerge()` instead
of the bare `twMerge()`, registering `lib/design-tokens.ts` `fontSize`'s
exact keys under Tailwind's `font-size` class group — the single source
of truth for the type scale extended to the one place that needed to
know about it, rather than a second hard-coded list. Verified against
the actual installed `tailwind-merge` before and after
(`twMerge('text-ground', 'text-body')` → `'text-body'` before, `'text-ground
text-body'` after; a genuine same-group conflict,
`twMerge('text-ground', 'text-ink')`, still correctly resolves to
`'text-ink'` — the fix is additive, not a loosening of real conflict
detection).

Consequences: Every existing `onDark`/`onDarkSecondary` button on the
site was silently rendering invisible (background-colored) text before
this fix — confirmed live on `/showcases/smile-care-dental`'s "Visit the
live site" / "Get your free audit" pair, both now visibly correct with
no other code change. `npm run typecheck`/`lint`/`build` all pass. No
component using `cn()` needed to change — the fix is entirely inside the
one shared utility every component already calls through.

### ADR-016: First-impression psychology audit — five small, clearly-justified copy/metadata fixes; two real gaps flagged, not fixed

Date: 2026-09-06
Status: accepted

Context: The brief asked for a skeptical-first-time-visitor psychology
audit against 13 specific questions (What does Forge do? Is this for my
business? ... What is my next step?) and ten evaluation axes (clarity,
trust, risk, effort, social proof, specificity, price perception, choice
architecture, CTA friction, cognitive load), explicitly instructing
"make only improvements that are clearly justified" — not a general
redesign pass.

Findings, in descending severity:

1. **Two contradictory "free audit" experiences on the same site
   (not fixed — flagged for a product decision).** The homepage embeds
   `components/audit/AuditForm.tsx` directly under a "START HERE" banner
   that says *"A manual, 7-point review... reviewed by a person, not a
   script"* and an FAQ answer promising *"a private write-up"* — the
   original legacy-derived, async, human-review flow (`docs/forge-
   business-rules.md` §5), never removed, still labeled as-is. Every
   other "Get your free audit" control on the same page (header, the
   Problem section, all three pricing cards, the final CTA) instead
   links to `/audit`, the instant, self-serve, 9-question, computed-in-
   the-browser tool `ADR-009` built to *replace* that description. A
   visitor who fills in the embedded form is told to expect one thing;
   a visitor who clicks almost any button on the same page gets a
   completely different thing. **Not fixed in this pass** — reconciling
   it means deciding which experience is canonical (keep both as
   clearly-differentiated paths, or point the homepage embed at `/audit`
   instead), which is a product decision, not a copy fix.
2. **"What if I don't like it?" has no answer for Growth or Pro (not
   fixed — flagged).** The homepage FAQ answers this only for Launch
   ("you see the finished site live... before you pay anything"). No
   payment-timing, deposit, or refund policy exists anywhere in this
   codebase for the ₹15,000/₹25,000 tiers — `ADR-011` set their price,
   scope, revisions, delivery time, and support window, but not a
   payment schedule, and `forge-business-rules.md` HD#5 (refund policy
   for non-50/50 payment structures) is explicitly still open. Writing
   a reassuring answer here would mean inventing a policy that doesn't
   exist — not done, per the standing anti-fabrication rule this project
   has followed since its first audit.
3. **No visible way to reach a person directly (not fixed — pre-existing,
   HD#13).** `SITE.whatsappNumber`/`supportEmail` are still `null`, so
   `WhatsAppFloat` renders nothing; the only contact path anywhere on the
   site is a form. Already the single most-flagged open item across
   every prior handoff — restated here because it's also, concretely, a
   first-impression trust gap, not just an operational one.
4. **Fixed: doubled page title on every single page.** `lib/seo.ts`
   `buildMetadata()` appended `" — Forge"` to its `title`, and
   `app/layout.tsx`'s `title.template` (`'%s — Forge'`) appended it
   *again* — every browser tab, search snippet, and social share read
   "Page — Forge — Forge". Noted as a known, deliberately-deferred issue
   back in `ADR-009`; fixed now because a first-impression audit starts
   at the browser tab, before any page content loads. One-line fix:
   `buildMetadata()` now returns the plain `title`, letting the layout's
   template add the site name exactly once.
5. **Fixed: "template" language contradicted the Launch tier's own
   explicit positioning.** The commercial-ladder brief (`ADR-011`) said
   plainly "do not call it a template" for Launch, and `lib/constants.ts`
   already avoids the word ("every Launch site follows the same clean,
   proven layout") — but the homepage's process step ("industry-tuned
   template"), its own FAQ ("ready templates for salons..."), the
   `/design-system` demo, and all three uses in
   `content/showcases/asquare-venture.mdx` (a real, live showcase's
   description, problem statement, and body) still used it. Reworded
   all six user-facing instances to "layout"/"build"/"process" —
   wording already established elsewhere on the same pages, not new
   vocabulary.
6. **Fixed: "How it works" implied one universal timeline, contradicting
   the pricing section directly below it.** The steps
   (`~2 min`/`~30 min`/`~10 min`/`by tomorrow`) are Launch-specific — the
   file's own code comment already said so (`// the real .../tomorrow
   flow for the Launch tier`) — but the section header read as if it
   described every tier, while Growth ("2–4 days") and Pro ("5–7 days")
   sit in the very next section with visibly different timelines.
   Retitled to "How Launch works" / "Four steps to a live Launch
   website," with one added sentence stating Growth/Pro follow the same
   order over a longer, tier-specific timeline — a true statement drawn
   directly from each tier's own already-published process steps, not a
   new claim.
7. **Fixed: unexplained brand-name jargon inside a "no technical setup
   needed" promise.** The Launch tier's included-items list said "A
   Cloudflare account created and shared with you" — the stated ICP
   (`forge-business-rules.md` §2) explicitly does *not* know tools like
   Vercel/GitHub/Figma, so a bare vendor name here reads as an
   unexplained technical task, sitting a few sections below the hero's
   own "No technical setup needed" badge. Reworded to "Free hosting, set
   up and handled for you (via Cloudflare) — nothing for you to
   configure" — same fact, framed as something done *for* the visitor,
   matching the rest of that list's voice.

Decision: Ship items 4–7 (five files: `lib/seo.ts`, `app/page.tsx`,
`app/design-system/page.tsx`, `content/showcases/asquare-venture.mdx`,
`lib/constants.ts`) as the "clearly justified" improvements the brief
asked for — each is a small, low-risk wording/metadata correction with
no new claim, no invented policy, and no product decision embedded in
it. Leave items 1–3 as documented findings for the business owner/next
session, per the same discipline this project has applied to every
other open Human Decision.

Consequences: `npm run typecheck`/`lint`/`build` all pass (22/22 pages).
Verified live in browser: every page's `<title>` now reads "Page —
Forge" (not doubled); the homepage's process section now reads "How
Launch works" with the Growth/Pro caveat visible; `/websites/5000`'s
included list reads the reworded hosting line; `/showcases/asquare-
venture` contains no remaining use of "template." Findings 1–3 are not
coded fixes and should not be closed out until the business owner
resolves the underlying product/business decision each depends on.

### ADR-017: Pre-launch QA pass — six real bugs found and fixed, full functional/accessibility/SEO/performance/security/CRM sweep, Vercel chosen as deploy target

Date: 2026-09-06
Status: accepted

Context: The brief asked for a full pre-launch QA pass (functional,
responsive, accessibility, SEO, performance, security, business, CRM),
fixing technical issues that don't require a business decision, then
determining and executing a first deployment. Before doing any of that,
the user was asked to confirm scope; answers: run the full pass *and*
deploy to a preview this session; Vercel (this session already has
Vercel MCP tooling connected — no adapter risk for a stock Next.js App
Router app); platform-default preview URL, not the real domain; leave
lead-delivery (HD#11/HD#13) unresolved for this pass, as already
documented.

Decision — six real, verified bugs found and fixed (none required a
business decision):

1. **Fonts declared in the design system since ADR-005 were never
   actually loaded.** `tailwind.config.ts` has named Inter/Fraunces/
   JetBrains Mono as the brand type scale from day one, but no
   `next/font` call, `<link>`, or `@font-face` existed anywhere — every
   page silently rendered in the browser's default system font the
   entire time, on every prior session's screenshot. `next.config.mjs`'s
   CSP already allowlisted `fonts.googleapis.com`/`fonts.gstatic.com`,
   suggesting this was the original intent, just never wired up. Fixed
   with `next/font/google` in `app/layout.tsx` (self-hosted at build
   time — no external request, no CSP change needed, automatic
   `font-display: swap` and a metric-matched fallback font for zero
   layout shift), and `tailwind.config.ts`'s `fontFamily` now points at
   the resulting CSS variables. Verified live: `document.fonts` reports
   Inter/Fraunces/JetBrains Mono genuinely loaded; Fraunces italic now
   visibly renders as the intended serif accent (previously silently
   falling back to sans-serif).
2. **The Forge Free Audit tool silently failed to submit.** Submitting
   `AuditInputForm` with the business-name/URL fields empty (or any
   question unanswered) did nothing visible at all — no error, no state
   change. Root cause: the two text fields and every radio input carried
   an HTML `required` attribute *in addition to* the component's own
   `handleSubmit` validation (which already produces a proper, styled,
   `role="alert"` error). A browser's native constraint validation
   intercepts the `submit` event before React's handler ever runs when a
   required field is invalid — so the custom, better-designed error path
   was dead code, and the native fallback (a browser tooltip) wasn't
   reliably visible either. Fixed by removing every `required` attribute
   from this form, since `handleSubmit` already validates everything
   correctly. Verified live, both before (silent no-op, confirmed via
   `document.querySelector('[role=alert]')` returning nothing) and after
   (the exact expected message appears).
3. **`/websites/25000`'s SEO description still said the tier didn't
   exist.** `app/websites/25000/page.tsx` hard-coded
   `description: 'Pending confirmation — no ₹25,000 tier exists in the
   source codebase yet.'` — true before ADR-011, false and contradictory
   since. The sibling `/websites/5000` and `/15000` pages both already
   used `tier.tagline` dynamically; `/25000` was never updated to match
   when its tier was resolved. Fixed to the same pattern. This is
   exactly the kind of confusing/contradictory-claim bug the brief's
   "Business QA" section asked to catch — found by grepping for stale
   price/status language across the whole tree, not by inspecting this
   file directly.
4. **Closed mobile-menu links stayed in the keyboard tab order.** The
   nav panel's open/close animation (a `grid-template-rows: 0fr → 1fr`
   transition, `ADR-005`'s pattern) only clips the panel to zero height
   visually — its 7 links remained individually focusable via Tab while
   "closed," confirmed live (`offsetParent !== null`, `tabIndex === 0`
   on a 1px-tall panel). Fixed with the `inert` attribute (React 19
   supports it natively), toggled opposite `mobileOpen` — removes the
   whole panel from both tab order and the accessibility tree while
   collapsed, without touching the existing CSS-only animation. Verified
   live: focus now skips the panel entirely while closed; opening
   correctly clears `inert` and restores normal tab flow through it.
5. **The 404 page had no distinct title** — every not-found URL's
   browser tab and search snippet read the generic site default
   ("Forge"), not "Page not found." Fixed with a static `metadata` export
   (no canonical — a catch-all 404 has no single canonical URL by
   definition) plus an explicit `noindex` (belt-and-suspenders alongside
   the already-correct 404 HTTP status).
6. **JSON-LD structured data used bare `JSON.stringify()` inside
   `dangerouslySetInnerHTML`**, which doesn't escape `<`, so a literal
   `</script>` inside any field would terminate the script tag early.
   Every current source is site-authored MDX frontmatter, not visitor
   input — defense-in-depth, not a fix for an active exploit. New
   `lib/seo.ts` `jsonLdScript()` helper (`JSON.stringify` +
   `<` → `<`) now backs all four structured-data script tags
   (showcase, blog post, both breadcrumb blocks).

Also verified extensively, nothing further to fix: CRM lead capture,
email-based dedup (a genuine duplicate produced no second record),
Referer-derived UTM capture (`utm_source`/`utm_medium`/`utm_campaign`
all confirmed landing on the stored lead), graceful CRM-failure handling
(temporarily switched `CRM_PROVIDER=hubspot` — its throwing stub — and
confirmed the form shows a calm "temporarily unavailable" status with no
page crash), PII-safe server logs (`safeLogFields()` output contains only
`{leadId, source, currentStage, hasEmail, hasPhone}`, confirmed against
real log output), no secrets/API keys/`.env` anywhere in the tree, no
`NEXT_PUBLIC_`-prefixed env var exposes anything server-only, every
external link already carries `rel="noopener noreferrer"`, contrast
ratios on body text/headings/buttons/captions all exceed WCAG AA (4.95:1
to 15.6:1, measured against real computed styles), `prefers-reduced-
motion` is already handled globally, responsive layout holds correctly
at 375/768/1920px (the last verified via computed container margins,
since the viewport tool's screenshot itself is capped narrower than
1920px), and no stale pricing/fake review/fake metric/fake-scarcity
language exists anywhere outside `legacy/` and historical doc citations.

Deployment target: **Vercel**, chosen because (a) the app is a stock
Next.js App Router deployment — mostly static/SSG routes, two dynamic
routes (`/blog`'s searchParams-driven filter, `/r/[code]`'s Route
Handler), two Server Actions (`app/actions.ts`), zero traditional REST
API routes — exactly Vercel's reference target, no adapter needed; and
(b) this session already has Vercel MCP tooling connected, vs. zero
Cloudflare tooling and an unverified `@cloudflare/next-on-pages`
compatibility story for Server Actions + this Route Handler. Full
verification and the actual deployment: `docs/deployment.md`.

Consequences: `npm run typecheck`/`lint`/`build` all pass (22/22 pages)
after every fix in this entry, verified as one final clean pass, not
per-fix. Two of the six fixes (fonts, the audit-form `required` bug) are
genuinely user-facing regressions that predate this session and were
silently shipping — worth noting for whoever reviews this diff, since
neither shows up in a build log or a static screenshot the way a broken
build would.

### ADR-018: `next-mdx-remote` upgraded 5.0.0 → 6.0.0 — CVE-2026-0969, caught by Vercel's build itself, not by local tooling

Date: 2026-09-06
Status: accepted

Context: The first real Vercel deployment attempt (ADR-017, §5 of
`docs/deployment.md`) failed the build outright —
`errorCode: VULNERABLE_NEXTMDXREMOTE_VERSION`, refusing to build a known-
vulnerable dependency (`next-mdx-remote@5.0.0`, CVE-2026-0969). Neither
`npm run typecheck`/`lint`/`build` nor the earlier QA pass's dependency
review (ADR-017) caught this — that review checked for secrets/API-key
exposure, not CVE/advisory scanning, which none of this project's local
tooling does automatically. Vercel's own build pipeline is what actually
caught it, which is itself a useful data point: a clean local build is
not the same guarantee as a clean deploy.

Decision: Upgraded to `next-mdx-remote@6.0.0` — the only version that
resolves the CVE (no 5.x patch exists; `npm view` confirms the package
jumps straight from 5.0.0 to 6.0.0). Checked the dependency diff before
upgrading (`npm view next-mdx-remote@6.0.0 dependencies` vs. `@5.0.0`):
only two transitive deps changed (`unist-util-remove` bumped,
`unist-util-visit` added), no signal of an API rewrite behind the major
version bump. Both real usage sites
(`app/showcases/[slug]/page.tsx`, `components/blog/ArticleBody.tsx`,
both `<MDXRemote source={...} components={...} />` from
`next-mdx-remote/rsc`) needed no code changes — verified by full
`typecheck`/`lint`/`build`, then live in a browser: MDX body content,
custom heading-anchor `components` override, and `TableOfContents`
anchor-id matching all still work identically post-upgrade.

Also found by the same `npm audit` pass, deliberately **not fixed**:
`postcss <=8.5.22` (high severity — CSS stringify XSS, source-map path
traversal) is a transitive dependency **bundled inside `next` itself**
(`node_modules/next/node_modules/postcss`), not a direct dependency of
this project. `npm audit fix --force` would resolve it only by installing
`next@16.3.4` — a major-version jump with real breaking-change risk,
well beyond a QA-pass-scoped fix. Actual exploitability here is low: this
app's PostCSS usage is entirely build-time, processing only this
repository's own trusted `.css`/Tailwind source, never visitor-submitted
or otherwise untrusted CSS at runtime — the vulnerable code path
(processing attacker-controlled CSS) is never reached. Flagged as a
WARNING for a deliberate, scheduled Next.js major-version upgrade, not a
launch blocker.

Consequences: `npm run typecheck`/`lint`/`build` all pass post-upgrade.
Vercel's build was retriggered after this fix — see `docs/deployment.md`
for the resulting deployment's outcome. `package.json`'s
`next-mdx-remote` range is now `^6.0.0`.

### ADR-019: `/r/[code]` returned a hard 500 on Vercel — file-store writes fail on a read-only serverless filesystem, and this one route had no fallback

Date: 2026-09-06
Status: accepted

Context: With the build finally succeeding (ADR-018), the first real
test of the deployed app itself — not just a green build — found
`GET /r/anything` returning `500` on every request. `get_runtime_errors`
(Vercel MCP) pointed at the exact cause immediately:
`Error: ENOENT: no such file or directory, mkdir '/var/task/.data'`,
thrown from inside `.next/server/app/r/[code]/route.js`. `lib/file-store.ts`
— the storage layer behind both `lib/referrals.ts` and the CRM's
`console` provider — creates a `.data/` directory on first write.
Vercel's serverless functions run from a read-only deployment bundle;
nothing under `/var/task` can be created or written at runtime. This is
a genuine platform difference from every environment this app had been
tested in before (local `dev`, local `build`) — both have an ordinary
writable filesystem.

The same underlying failure mode already existed for lead capture
(`app/actions.ts`'s Server Actions also call into `lib/crm.ts`, which
uses the same file-store-backed `console` provider) — but that path was
already protected: `ADR-010` wrapped every `CrmAdapter` operation in
`try`/`catch`, resolving to `{ok: false, error}` instead of throwing.
Tested directly against the live deployment to confirm: submitting the
homepage lead form there correctly shows "The CRM is temporarily
unavailable. This does not affect the rest of the site." — no crash,
exactly as designed. `app/r/[code]/route.ts` was the one place that
same storage layer was called *without* that protection — a plain,
unguarded `resolveReferralCode(code)`/`recordReferralClick(code)` call,
so the `mkdir` failure propagated all the way up to a framework-level
500.

Decision: Wrapped both calls in `try`/`catch`. A failure resolving the
code now produces the exact same outcome the route already defined for
an *unrecognized* code — redirect to `/audit`, no attribution — rather
than a distinct failure path. A failure recording the click is swallowed
outright (the redirect proceeds either way; only the click counter is
lost). This matches the route's own already-stated design principle,
quoted directly in its file header: "A mistyped or stale referral link
should never dead-end a visitor." A storage outage is just another
reason a code can't be resolved, from the visitor's perspective — it
was already supposed to degrade the same way, and now does.

Consequences: `npm run typecheck`/`lint`/`build` all pass. This also
means the file-backed `console` CRM provider and `lib/referrals.ts`
should be treated as **non-functional on Vercel's serverless runtime
specifically** (not just "doesn't persist between requests," as
`docs/deployment.md` previously and too gently put it before this was
confirmed directly — every write attempt fails outright there). Every
call site now degrades gracefully instead of crashing, which is the
correct behavior for a still-unresolved HD#11 (real CRM destination),
but does not change the fact that HD#11 needs a real answer before any
deployment on this platform can actually capture or track a lead, a
referral click, or a referral conversion. `docs/deployment.md` §5
updated with this finding directly.
