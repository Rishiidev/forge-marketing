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
