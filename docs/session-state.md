# Forge Marketing — Session State

> Reference snapshot of the repository's current, verified state. Generated
> at the end of a Claude Code session, from direct inspection of the
> repository (git log, file reads, `npm run typecheck`/`lint`/`build`) —
> not from memory of the conversation that produced it. If anything below
> conflicts with the actual repository contents, the repository wins; this
> file describes a point in time.
>
> Companion document: [`docs/session-handoff.md`](session-handoff.md) —
> read that one first. It says what changed, what's unresolved, and what
> to do next. This one is the detailed backing reference.

Snapshot date: 2026-09-05.

---

## 1. What the original Forge project contained

The original project (before this rebuild) was a static marketing site,
preserved unmodified at [`legacy/`](../legacy/) (moved there via `git mv`
in commit `f99c480`, not edited — see ADR-003 in
[`docs/decisions.md`](decisions.md)).

**Contents of `legacy/`:**
- 9 static HTML pages, each with inline CSS and JS: `index.html`,
  `audit.html`, `5000-setup.html`, `made-for-you.html`,
  `bespoke-quote.html`, `operator.html`, `thanks.html`, `privacy.html`,
  `terms.html`.
- `legacy/forge-wa-submit.js` — shared client-side form handler that opens
  a pre-filled WhatsApp chat on form submit.
- `legacy/api/submit.js` — a Vercel serverless function that fans a
  submitted lead out to three services: Resend (email), Supabase
  (Postgres), and GitHub (a private-repo JSON backup, one file per lead).
  It also computes a `priority_score` field per lead.
- `legacy/api/wa-number.js` — a second serverless function (not audited
  in depth; present in the source, not migrated).
- `legacy/forge-icp-and-templates.md` — the ICP and industry-template
  definitions (source for `lib/constants.ts` `INDUSTRY_TEMPLATES`).
- `legacy/README.md` and `docs/legacy-readme.md` (a preserved copy) —
  the original authors' own notes: run instructions, the capacity-cap
  mechanism, and the "honest line" content principle (no fake scarcity,
  no fabricated testimonials, no decorative countdowns).
- Static assets: logo files, favicons, `legacy/package.json`,
  `legacy/vercel.json` (the original CSP and routing config).

**What it sold, as coded (full detail in
[`docs/forge-business-rules.md`](forge-business-rules.md)):** turning a
local business's Google Business Profile into a website, across several
**inconsistent, overlapping pricing structures** found across different
pages — this inconsistency is itself one of the most important facts
about the original project, not a rebuild defect. See §14 below.

This repository's `main` branch holds the baseline import of that
original project, untouched, at commit `272c836`. All rebuild work
happens on `rebuild` (and would happen on further feature branches off
it, per [`README.md`](../README.md) "Branches").

---

## 2. Current architecture

Full detail: [`docs/architecture.md`](architecture.md) (living document,
kept current — read it directly rather than trusting a summary to stay
in sync). Condensed here for orientation:

**Stack:** Next.js 15 (App Router), React 19, TypeScript (strict mode),
Tailwind CSS v3 (token-driven, `theme` values replaced not extended),
MDX content via `gray-matter` + `next-mdx-remote/rsc`. No CMS, no
database, no auth, no payment processing — all explicitly out of scope
per the rebuild brief. The customer application
(`app.forge.bruuhh.com`) is a separate, not-yet-started surface.

**Routing** (all under `app/`, App Router):

| Route | Status |
|---|---|
| `/` | Real, complete. 12-section homepage per `docs/conversion-architecture.md`. |
| `/audit` | Real, complete. Sourced from `legacy/audit.html`, functional form. |
| `/websites`, `/websites/5000`, `/websites/15000`, `/websites/25000` | Real, complete (the ₹25,000 page correctly displays "pending confirmation" — see §5 HD#2). |
| `/maintenance` | Real, complete, but pricing itself is one of two conflicting numbers in the source — see §5 HD#3. |
| `/showcases`, `/showcases/[slug]` | Real, complete. Built this session — see §6, ADR-008. |
| `/tools` | Scaffolded route, **no real content**. `lib/constants.ts` `TOOLS` is an empty array; the page says so explicitly rather than showing an empty grid silently. |
| `/blog`, `/blog/[slug]` | Scaffolded route, **one placeholder post** (`content/blog/hello-world.mdx`), explicitly labeled "not real Forge blog content" — proves the MDX pipeline works, nothing more. |
| `/design-system` | Internal only, `noindex`/unlinked. Live preview of every design token and primitive, rendered from the same source Tailwind consumes. |

**Data layer.** All business data (pricing, maintenance plans, capacity,
industry templates, tools registry, nav, contact info) lives in
`lib/constants.ts`. Fields with no confirmed real value are typed and
set explicitly to `null` / `status: 'tbd'`, never guessed:
- `SITE.supportEmail` — `null` (HD#13).
- `SITE.whatsappNumber` — `null` (HD#13). `WhatsAppFloat` renders nothing
  until this is set (`components/conversion/WhatsAppFloat.tsx`).
- `WEBSITE_TIERS` (`'25000'` slug) — `price: null`, `status: 'tbd'` (HD#2).
- `CAPACITY.status` — `'tbd'`; `CapacityStrip` renders nothing until a
  real current period's numbers are set and this flips to `'confirmed'`.
- `TOOLS` — empty array (no tool built yet; not a gap, a "nothing to
  show yet" state).

**Content layer.** `content/blog/*.mdx` and `content/showcases/*.mdx`,
read at build/request time by `lib/content.ts` (generic loader) and, for
showcases specifically, `lib/showcases.ts` (typed frontmatter +
publishable-entry filtering + featured selection — see §6).

**Lead capture.** One Server Action, `app/actions.ts`
`submitLeadAction()`, behind every lead form
(`components/forms/useLeadForm.ts`). It checks a honeypot field, does
minimal email validation, then calls `lib/crm.ts` `captureLead()`.
`lib/crm.ts` is a provider abstraction:
- `console` (**current default, active in this repo — no `.env` file
  exists**) — logs to the server console, never fails, sends data
  nowhere.
- `webhook` — POSTs JSON to `CRM_WEBHOOK_URL` if `CRM_PROVIDER=webhook`
  is set. Generic, works with Zapier/Make/n8n/a custom endpoint.
- `hubspot` — named stub, throws a clear error if selected (not
  implemented).

**Important operational fact:** because no `CRM_PROVIDER` is configured,
every lead submitted through this site right now (in this environment)
is only logged to the server console. Nothing reaches a person. This is
correct, safe *default* behavior for local development — but it means
the site is **not yet wired to actually deliver a lead to Forge** in any
deployed environment either, unless `CRM_PROVIDER`/`CRM_WEBHOOK_URL` (or
a real CRM decision, HD#11) has been set somewhere this repo doesn't
show (e.g. Vercel project env vars, which aren't visible from the repo).

**Analytics.** `lib/analytics.ts` `trackEvent()`, no-op/console-only by
default. Explicitly not wired to any real analytics vendor — the legacy
site's `privacy.html` makes a live public "no third-party trackers"
promise, and HD#12 (whether to run analytics at all) is unresolved. The
event taxonomy is fully designed in `docs/conversion-architecture.md`
§7; not every defined event is wired to a call site yet (see §6 below
for which ones are).

**SEO.** `lib/seo.ts` `buildMetadata()` is the only way any page sets
title/description/canonical/OpenGraph metadata. `/showcases/[slug]` also
emits a JSON-LD `CreativeWork`/`LocalBusiness` block per entry, built
directly from the same frontmatter (added this session).

**Design system.** Tokens in `lib/design-tokens.ts`, consumed by both
`tailwind.config.ts` and `/design-system` so the preview can't drift
from what's actually themed. Primitives in `components/ui/*`
(`Container`, `Section`, `Heading`, `Text`, `Button`, `Link`, `Badge`,
`Card`, `Input`, `Textarea`, `Select`, `Accordion`, `Divider`).

**Component folders:**

```
components/
  ui/          Design-system primitives (see above)
  layout/      SiteHeader, SiteFooter
  marketing/   PageHero, FeatureList, CTA, ProcessStep, Metric, Testimonial,
               Review, FAQ, Hero, TransformationCompare, TrustSignals
  conversion/  WhatsAppFloat, CapacityStrip, TrackedCtaLink
  pricing/     PriceCard, PricingTierGrid, WebsiteTierPage
  audit/       AuditForm
  showcases/   ShowcaseCard, ShowcaseGrid, ShowcaseViewTracker
  tools/       ToolCard, ToolGrid
  blog/        BlogCard, BlogList
  forms/       TextField, SelectField, Honeypot, SubmitButton, FormStatus, useLeadForm
```

**Lib files:**

```
lib/
  constants.ts      Central business data (pricing, plans, capacity, nav, contact)
  design-tokens.ts  Raw design tokens — single source for Tailwind + /design-system
  analytics.ts      trackEvent() abstraction, no-op by default
  crm.ts            captureLead()/trackLeadEvent()/updateLeadStage() + provider interface
  seo.ts            buildMetadata() — the only page-metadata entry point
  utils.ts          cn(), formatINR(), slugify()
  content.ts        Generic MDX filesystem loader (ADR-002)
  showcases.ts      Showcase domain layer on top of content.ts (ADR-008)
```

**Testing.** No automated test suite exists in this repository (no
`*.test.*`/`*.spec.*` files, no test runner configured). Verification
throughout this rebuild has been: `npm run typecheck`, `npm run lint`,
`npm run build`, plus manual browser checks (desktop + mobile viewport,
interactive states, console/network inspection) performed during each
session and described in that session's commit message and/or
`docs/decisions.md` entry. There is no CI configuration in this repo
(no `.github/workflows/`).

---

## 3. Current business rules

Full detail, with citations to the exact source file/line for every
claim: [`docs/forge-business-rules.md`](forge-business-rules.md). This
is the project's business source of truth — **if it conflicts with a
specific page in the legacy code, the document wins; that's its stated
purpose.** Do not treat a summary (including this one) as a substitute
for reading it before writing customer-facing copy, pricing, or claims.

Structure of that document (21 numbered sections + a psychology-
principles section + a consolidated "Human Decisions Required" list):
positioning, target customer/ICP, customer problem, why customers care,
free audit purpose, the ₹5,000/₹15,000/₹25,000 products, maintenance
offer, customer ownership policy, delivery process, revision policy,
refund policy, referral program (none exists), review/testimonial
policy (none exists, strong anti-fabrication stance), showcase/case-
study policy, allowed vs. prohibited marketing claims, customer data
rules (with a **known live discrepancy** between `privacy.html` and
`api/submit.js` — see HD#9 below), CRM lifecycle (none implemented),
analytics events (none exist in the legacy code).

**The 14 open Human Decisions**, verbatim from that document's own list
(§"HUMAN DECISIONS REQUIRED") — every one of these still requires the
business owner, not engineering judgment:

1. **Canonical funnel** — ₹9,999→₹24,999 (`index.html`) vs.
   ₹5,000→₹15,000→₹30,000 (`5000-setup.html`), or both as separate
   channels. *Working assumption adopted 2026-09-05* (not a resolution):
   `docs/conversion-architecture.md` proceeds on
   `Free Audit → ₹5,000 Website` as the primary funnel, for planning
   purposes only.
2. **The ₹25,000 figure** named in the rebuild brief doesn't exist at
   any real price point (`₹24,999` and `₹30,000` are the two nearest).
3. **Maintenance pricing** — three tiers (₹1,499/₹3,999/₹7,999,
   `operator.html`) vs. a flat ₹1,999/mo (`5000-setup.html`).
4. **Revision policy** — is the ₹5,000 tier's zero revisions intentional,
   or should every paid tier include at least one?
5. **Refund policy** for the ₹5,000 tier's pay-after-approval model and
   the bespoke calculator's three-part split (only a 50/50 refund policy
   is written).
6. **Whether to build a referral program**, and its mechanics.
7. **Testimonial consent and usage policy** — no process exists for
   ethically collecting/publishing a real testimonial once given.
8. **Showcase/case-study consent** — confirm the three named clients on
   `5000-setup.html` explicitly agreed to be shown, and set a policy for
   future clients. *Treated as resolved-by-instruction for the three
   existing entries only* (ADR-007, reaffirmed ADR-008) — the formal
   consent *process* for future clients is still undesigned.
9. **Privacy policy accuracy** — `privacy.html` omits Supabase/GitHub as
   data recipients and claims no lead scoring happens, while
   `api/submit.js` computes a `priority_score`. Live discrepancy, not
   just an open question.
10. **Data retention enforcement** — stated 90-day/12-month windows have
    no visible deletion mechanism in this repo.
11. **CRM strategy** — is Supabase the CRM, does it feed an external CRM,
    or does the rebuild need real pipeline stages (`lib/crm.ts`'s
    `LeadStage` type is a forward-looking addition, not wired to
    anything yet)?
12. **Analytics decision** — whether to run any analytics/tracking at
    all, reconciled with the existing "no third-party trackers" promise.
13. **Canonical contact channel** — no real, resolvable support email or
    WhatsApp number exists anywhere in the source. **This is the most
    launch-blocking item**: `SITE.whatsappNumber`/`SITE.supportEmail` are
    `null`, `WhatsAppFloat` renders nothing, and no `CRM_PROVIDER` is
    configured — see §2 above.
14. **Single positioning statement** — confirm the hero-copy positioning
    is still accurate before treating it as a fixed anchor.

---

## 4. Decision log (ADRs)

Full text: [`docs/decisions.md`](decisions.md). One line each, in order:

| ADR | Title |
|---|---|
| 000 | Establish baseline repository |
| 001 | Next.js/TypeScript/Tailwind/MDX rebuild architecture |
| 002 | `lib/content.ts` added beyond the five named lib files |
| 003 | Legacy static site relocated to `legacy/`, not deleted |
| 004 | CSP `script-src` must allow `'unsafe-eval'` in development only |
| 005 | Design system — token architecture and positioning |
| 006 | Conversion architecture written before the homepage |
| 007 | Homepage built; real showcase consent treated as resolved-by-instruction |
| 008 | Showcase system — data model, one card component, review architecture deferred |

This is an **append-only log** — see
[`docs/session-handoff.md`](session-handoff.md) §"Files that must not be
modified" for the convention this session followed (never rewrite a past
ADR's Decision/Consequences; add a new ADR that references it instead).

---

## 5. Verified build/test status (as of this snapshot)

Run directly, in this repository, immediately before writing this file:

```
npm run typecheck   → clean, no errors
npm run lint         → "✔ No ESLint warnings or errors" (next lint; deprecation notice only)
npm run build        → succeeds, 18/18 static pages generated, no warnings
```

Route sizes from the last build (informational, not a regression
baseline — no performance budget/CI check enforces these numbers):

```
/                          922 B    First Load JS 116 kB
/showcases                 185 B    First Load JS 106 kB
/showcases/[slug]         1.05 kB   First Load JS 114 kB
/design-system             833 B    First Load JS 116 kB
(all other routes)         ~131–185 B, First Load JS 103–106 kB
+ shared JS                103 kB
```

`git status --short` is clean (no uncommitted changes) as of this
snapshot.

---

## 6. Showcase system detail (most recent feature, built this session)

Full detail: `docs/architecture.md` §"The showcase system", ADR-008 in
`docs/decisions.md`. Summary for orientation:

- Data model lives in `lib/showcases.ts` (`ShowcaseFrontmatter`,
  `Showcase`, `ShowcaseMetric` types; `getAllShowcases()`,
  `getFeaturedShowcases()`, `getShowcaseBySlug()`).
- Three real content entries exist:
  `content/showcases/smile-care-dental.mdx`,
  `content/showcases/asquare-venture.mdx`,
  `content/showcases/we-health-care-diagnostic.mdx` — sourced from
  `legacy/5000-setup.html` and `docs/forge-business-rules.md` §6.
- A showcase is only listed/visible if it has `name`, `industry`,
  `websiteUrl`, and `description` (`isPublishable()` in
  `lib/showcases.ts`). Every other field (`problem`, `solution`,
  `services`, `review`/`reviewAuthor`/`reviewRole`/`reviewRating`,
  `screenshots`, `featuredImage`, `launchDate`, `featured`, `metrics`)
  is optional and only rendered when present — no field is ever
  defaulted to a placeholder value.
- `showcase_viewed` (previously defined but unwired in
  `lib/analytics.ts`) now fires once per detail-page view via
  `components/showcases/ShowcaseViewTracker.tsx` — the only Client
  Component in this system.
- Review-request/approval workflow is **designed but not built** —
  `review`/`reviewAuthor`/`reviewRole`/`reviewRating` are shaped so a
  future `reviews` record (keyed by customer + showcase slug, with a
  `status: pending | approved` field) could populate them without a
  rename. No dashboard, no collection automation exists, by design.
