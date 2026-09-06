# Forge Marketing — Session State

> Reference snapshot of the repository's current, verified state. Generated
> at a checkpoint review, from direct inspection of the repository (git
> status, file reads, `npm run typecheck`/`lint`/`build`) — not from
> memory of the conversation that produced it. If anything below
> conflicts with the actual repository contents, the repository wins;
> this file describes a point in time.
>
> Companion document: [`docs/session-handoff.md`](session-handoff.md) —
> read that one first. It says what changed, what's unresolved, and what
> to do next. This one is the detailed backing reference.

Snapshot date: 2026-09-06.

> **Staleness note (added 2026-09-07, SEO/organic-growth session):** this
> file was not regenerated for the tools-engine commits (`f51014e`,
> `6a98d00`) or this session's SEO fixes — it still describes the
> tailwind-merge-fix checkpoint below as current. For what's actually
> true now, read `docs/session-handoff.md` §16–§17 first; this file's
> body is left as a historical reference rather than rewritten wholesale,
> matching this repo's own "if anything below conflicts with the actual
> repository contents, the repository wins" rule at the top of this
> file. A future session doing significant further work here should
> regenerate this file properly rather than adding a fourth stale layer.

---

## 1. What the original Forge project contained

Unchanged from prior snapshots — see [`docs/forge-business-rules.md`](forge-business-rules.md)
and [`docs/legacy-readme.md`](legacy-readme.md). Summary: a static HTML
marketing site (9 pages, inline CSS/JS, two Vercel serverless functions
for lead capture), preserved unmodified at [`legacy/`](../legacy/).
This repository's `main` branch holds the untouched baseline import at
commit `272c836`. All rebuild work happens on `rebuild`.

---

## 2. Current architecture

Full detail: [`docs/architecture.md`](architecture.md) (living document —
read it directly). Condensed here for orientation:

**Stack:** Next.js 15 (App Router), React 19, TypeScript (strict mode),
Tailwind CSS v3 (token-driven), MDX content via `gray-matter` +
`next-mdx-remote/rsc`. No CMS, no database, no auth, no payment
processing.

**Routing** (all under `app/`, App Router):

| Route | Status |
|---|---|
| `/` | Real, complete. 12-section homepage. |
| `/audit` | Real, complete. Full interactive Forge Free Audit tool (ADR-009). |
| `/websites`, `/websites/5000`, `/websites/15000`, `/websites/25000` | Real, complete. Full ₹5,000/₹15,000/₹25,000 (Launch/Growth/Pro) commercial ladder, business-owner-set (ADR-011) — no tier is pending confirmation anymore. |
| `/maintenance` | Real, complete. Reframed as ongoing technical care, not just hosting (ADR-011). Pricing itself still one of two conflicting numbers in the legacy source — HD#3 open. |
| `/showcases`, `/showcases/[slug]` | Real, complete (ADR-008). |
| `/blog`, `/blog/[slug]` | **Real, complete as of this session (ADR-014).** Three real articles across three topic clusters, full SEO surface, category filter, related articles, per-post CTA. No longer a placeholder route. |
| `/tools` | Scaffolded route, **no real content**. `lib/constants.ts` `TOOLS` is an empty array. |
| `/design-system` | Internal only, `noindex`/unlinked. |
| `/r/[code]` | Route Handler (not a page) — referral-link resolution + attribution cookie, always redirects to `/audit` (ADR-012). |
| `/sitemap.xml`, `/robots.txt` | **New this session (ADR-014).** Native Next.js `MetadataRoute` files, data-driven from the same functions the pages render from. |

**Data layer.** All business data lives in `lib/constants.ts`. The
₹25,000 tier's price and the commercial ladder generally are now
`status: 'confirmed'` (ADR-011) — the only remaining `null`/`'tbd'`
fields are `SITE.supportEmail`, `SITE.whatsappNumber`, `CAPACITY`
(deliberately, no real cap exists), and `REFERRAL_REWARD_CONFIG`
(deliberately, HD#6 unresolved).

**Content layer.** `content/blog/*.mdx` (3 real posts) and
`content/showcases/*.mdx` (3 real entries), read by `lib/content.ts`,
with `lib/blog.ts` and `lib/showcases.ts` as typed domain layers on top.

**Lead capture / CRM.** `lib/crm.ts` is now a full `CrmAdapter` (six
operations, 20-field `Lead`, 17-stage `LeadStage`, dedup, rate-limiting,
graceful degradation — ADR-010) backed by `lib/file-store.ts`
(JSON-file-backed, not a bare in-memory `Map` — ADR-013) when the
`console` provider is active (the current default; no `.env` exists).
`lib/reviews.ts` and `lib/referrals.ts` (ADR-012) sit on top of the same
adapter for the post-delivery loop (review request → showcase
eligibility → referral). **Still true: no lead reaches a real person in
any deployed environment unless `CRM_PROVIDER`/`CRM_WEBHOOK_URL` is set
outside this repo.**

**Analytics.** `lib/analytics.ts` `trackEvent()`, no-op/console-only by
default, unchanged in philosophy. `blog_viewed` (new this session) and
`showcase_viewed` are now both wired; several events in the taxonomy
(`pricing_viewed`, `whatsapp_clicked`, etc.) still have no call site —
documented limitation, not an oversight.

**SEO.** `lib/seo.ts` `buildMetadata()` now supports `type: 'article'`
(OpenGraph article tags) in addition to the default `'website'`, plus a
new `buildBreadcrumbJsonLd()`. Every page still routes through this one
helper. **Verified this session: nothing on the site is noindexed except
`/design-system` (intentional, documented) — see
[`docs/session-handoff.md`](session-handoff.md) for the full noindex
audit.**

**Design system.** Tokens in `lib/design-tokens.ts`, consumed by both
`tailwind.config.ts` and `/design-system`. **`lib/utils.ts` `cn()` was
fixed this session (ADR-015)** — see §7 below for the bug and fix in
detail.

**Component folders:**

```
components/
  ui/          Design-system primitives (Container, Section, Heading, Text, Button,
               Link, Badge, Card, Input, Textarea, Select, Accordion, Divider)
  layout/      SiteHeader, SiteFooter
  marketing/   PageHero, FeatureList, CTA, ProcessStep, Metric, Testimonial,
               Review, FAQ, Hero, TransformationCompare, TrustSignals, Breadcrumbs
  conversion/  WhatsAppFloat, CapacityStrip, TrackedCtaLink
  pricing/     PriceCard, PricingTierGrid, PricingComparisonTable, WebsiteTierPage
  audit/       AuditForm, AuditTool, AuditInputForm, AuditProcessing,
               AuditResultView, AuditLeadCaptureForm
  showcases/   ShowcaseCard, ShowcaseGrid, ShowcaseViewTracker
  tools/       ToolCard, ToolGrid
  blog/        BlogCard, BlogList, ArticleHeader, ArticleBody, TableOfContents,
               RelatedArticles, ArticleCTA, BlogViewTracker
  forms/       TextField, SelectField, Honeypot, SubmitButton, FormStatus, useLeadForm
```

**Lib files:**

```
lib/
  constants.ts      Central business data (pricing ladder now confirmed — ADR-011)
  design-tokens.ts  Raw design tokens
  analytics.ts      trackEvent() abstraction
  crm.ts            Full CrmAdapter — ADR-010
  seo.ts            buildMetadata() + buildBreadcrumbJsonLd() — ADR-014
  utils.ts          cn() (tailwind-merge, fixed — ADR-015), formatINR(), slugify()
  content.ts        Generic MDX filesystem loader
  showcases.ts      Showcase domain layer — ADR-008
  blog.ts           Blog domain layer, topic clusters, related-posts scoring,
                     TOC heading extraction — ADR-014
  audit.ts          Forge Free Audit scoring engine — ADR-009
  validation.ts     isValidEmail(), normalizeUrl() — ADR-010
  rate-limit.ts     In-memory rate limiter — ADR-010
  file-store.ts     JSON-file-backed key-value store — ADR-013
  referrals.ts      Referral codes/attribution/reward status — ADR-012
  reviews.ts        Review collection + showcase-candidate eligibility — ADR-012
```

**Testing.** `npm run test` (Vitest, added this session — see
[`docs/tools-cost-policy.md`](tools-cost-policy.md), ADR-021) now exists,
scoped to the zero-cost tools policy enforcement
(`lib/tools/__tests__/cost-policy.test.ts`, 13 tests). No CI still wired
up (no `.github/workflows/`). Everything else remains manual:
`npm run typecheck`/`lint`/`build` plus live-browser checks each session.

**Tools platform.** `lib/tools/types.ts` (`ToolDefinition`/`ToolInput`/
`ToolResult`/`ToolFinding`/`ToolError`/`ToolStatus`/`ToolCostProfile`/
`ToolDataSource`/`ToolCapability`/`ToolSecurityPolicy`) and
`lib/tools/cost-policy.ts` (`findForbiddenDependencies()`,
`validateToolDefinition()`) — see
[`docs/tools-cost-policy.md`](tools-cost-policy.md) and
[`docs/tool-cost-matrix.md`](tool-cost-matrix.md). `lib/constants.ts`
`TOOLS` is still `[]` — no individual tool was built this session, by
explicit instruction. `components/tools/ToolCard.tsx`,
`app/tools/[slug]/page.tsx`, and `app/sitemap.ts` were updated only to
honor the new type contract (a non-`'available'` tool renders disabled,
gets no live route, and no sitemap entry) — no visual redesign.

---

## 3. Current business rules

Source of truth unchanged: [`docs/forge-business-rules.md`](forge-business-rules.md).
**HD#1 (canonical funnel) and HD#2 (the ₹25,000 figure) are now resolved**
— both marked resolved in that document, citing ADR-011. The remaining
12 Human Decisions are still open; see that document's own list for the
current, authoritative text of each.

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
| 009 | Forge Free Audit rebuilt as a self-serve interactive tool |
| 010 | CRM rebuilt as a full adapter — Lead model, 17-stage lifecycle, dedup/rate-limiting/graceful degradation |
| 011 | Commercial ladder set directly by the business owner — ₹5,000/₹15,000/₹25,000, resolving HD#1 and HD#2 |
| 012 | Post-sale growth architecture — reviews, showcase eligibility, referrals |
| 013 | In-memory Maps replaced with a file-backed store |
| 014 | Blog and resource system — `/blog`, `/blog/[slug]`, topic clusters, full SEO surface |
| 015 | Fixed a site-wide bug — `text-color` utilities silently dropped when combined with Forge's custom `text-{size}` scale |
| 016 | First-impression psychology audit — five copy/metadata fixes, two gaps flagged not fixed |
| 017 | Pre-launch QA pass — six real bugs found/fixed; Vercel chosen as deploy target |
| 018 | `next-mdx-remote` upgraded 5.0.0 → 6.0.0 — CVE caught by Vercel's build, not local tooling |
| 019 | `/r/[code]` 500 on Vercel — file-store writes fail on read-only serverless filesystem, fixed |
| 020 | Pricing section rebuilt for visual hierarchy — no business data changed |
| 021 | Zero-cost tools architecture — policy, typed contract, automated enforcement for `/tools` |

Append-only log — never rewrite a past ADR's Decision/Consequences; add a
new ADR that references it instead. **This table was out of date from
ADR-016 through ADR-020 as of the previous snapshot** (ADR-020 itself
flagged this); corrected in this pass.

---

## 5. Verified build/test status (as of this checkpoint)

**Correction to the previous snapshot:** the prior version of this file
(and of `docs/session-handoff.md`) described a repository with zero
commits since `f72f58d` and substantial uncommitted work. That was
stale — real, committed history continued through ADR-016–ADR-020
(deployment to Vercel, a real bug fix, a CVE upgrade, a pricing-section
rebuild) with no session ever updating this file in between. ADR-020
flagged this gap explicitly; this checkpoint corrects it. **Always
cross-check `git log`/`git status` against this file's claims rather
than trusting the narrative alone** — this is the second time that
instruction has mattered in this project's history.

Run directly, in this repository, immediately before writing this file:

```
npm run typecheck   → clean, no errors
npm run lint         → "✔ No ESLint warnings or errors" (next lint; deprecation notice only)
npm run test         → 13/13 tests pass (Vitest, new this session — ADR-021)
npm run build        → succeeds, 22/22 static pages generated, no warnings
```

Route sizes from the last build (informational, not a regression
baseline):

```
/                          8.14 kB   First Load JS 125 kB
/audit                     8.64 kB   First Load JS 126 kB
/blog                      173 B     First Load JS 111 kB   (dynamic — reads searchParams)
/blog/[slug]               1.13 kB   First Load JS 119 kB   (SSG, 3 real posts)
/showcases/[slug]          1.13 kB   First Load JS 114 kB   (SSG, 3 real entries)
/design-system             2.5 kB    First Load JS 125 kB
/sitemap.xml, /robots.txt  136 B     First Load JS 103 kB
(all other routes)         ~160–180 B, First Load JS 103–106 kB
+ shared JS                103 kB
```

**Current branch: `main`.** Both `main` and `rebuild` exist
(`origin/main`, `origin/rebuild`), but `main` itself now holds all real
application history (22 commits, `272c836` through `4c215d1` before this
session's work) — the earlier "`main` is the untouched legacy baseline,
`rebuild` is where work happens" convention (ADR-000/ADR-003) no longer
describes the actual branch layout. Whoever next needs to reconcile
`main`/`rebuild` (`docs/deployment.md` §6's promotion checklist still
references this) should verify the current state directly rather than
trust either this file or `docs/deployment.md`'s branch narrative
without re-checking.

`git status --short` was clean at the start of this checkpoint's work
(everything through `4c215d1` committed). This session's own changes
(the zero-cost tools architecture — ADR-021) are uncommitted as this
file is written; see the recommended commit message in
`docs/session-handoff.md` §14.

---

## 6. The blog system (built this session)

Full detail: `docs/architecture.md` §"The blog system", ADR-014 in
`docs/decisions.md`. Summary for orientation:

- `lib/blog.ts`: `BLOG_CATEGORIES` (the nine topic clusters — Google
  Business Profile, Local SEO, Business websites, Online credibility,
  Reviews, Website conversion, Lead generation, Local marketing, Digital
  presence), typed `BlogFrontmatter`, `getRelatedPosts()` (internal
  linking, scored by category then tags), `extractHeadings()` (table of
  contents).
- Three real content entries exist, one per topic cluster demonstrated:
  `content/blog/optimize-google-business-profile-local-search.mdx`,
  `content/blog/google-business-profile-not-enough-need-website.mdx`,
  `content/blog/website-elements-that-convert-visitors-to-customers.mdx`.
  `content/blog/hello-world.mdx` (the original placeholder) was deleted,
  per its own body text, once real content existed.
- Full SEO surface: canonical, OpenGraph (`article` type), Twitter card,
  `BlogPosting` + `BreadcrumbList` structured data, semantic `h2`/`h3`
  with anchor ids matching the table of contents, `next/image` for
  featured and in-body images, `app/sitemap.ts`/`app/robots.ts`.
- **Verified not noindexed** — no `robots` field is set anywhere on
  `/blog` or `/blog/[slug]`, no middleware, no `X-Robots-Tag` header, no
  `vercel.json` in this repo. Only `/design-system` carries a page-level
  `noindex`, unchanged and intentional.
- `article → relevant tool → audit → Forge`: `ArticleCTA` always offers
  the free audit; each post's `ctaHref`/`ctaLabel` frontmatter points its
  secondary link at whatever's actually relevant to its topic. No
  fabricated stat, testimonial, or claim in any of the three real posts.

## 7. The tailwind-merge / Button contrast fix (found and fixed this session)

Full detail: ADR-015 in `docs/decisions.md`. Summary:

- **Bug:** `lib/utils.ts` `cn()` called plain `twMerge()` with no theme
  config. `tailwind-merge`'s default `text-color` group matches
  `text-{anything}` against a permissive fallback validator when no real
  theme colors are configured, so Forge's custom named type scale
  (`text-body`, `text-heading-lg`, etc. — `lib/design-tokens.ts`
  `fontSize`) was *also* classified as a text-color utility. Any
  component combining a real text color with one of these size classes
  (`Button`'s `onDark`/`onDarkSecondary` variants, paired with a `size`)
  had its real text color silently dropped in favor of the size class —
  producing button text the exact same color as its own background.
- **Not new-in-this-session breakage** — every existing use of `onDark`/
  `onDarkSecondary` (e.g. the showcase page's "Visit the live site"
  button) was already affected; it just hadn't been exercised by a live
  contrast check until this session's blog `ArticleCTA` tripped it.
- **Fix:** `cn()` now uses `extendTailwindMerge()`, registering
  `lib/design-tokens.ts` `fontSize`'s exact keys under Tailwind's
  `font-size` class group — single source of truth extended to the one
  place that needed to know about it.
- **Verified this session, twice** (once when found, once at this
  checkpoint): the fix holds against the actual installed
  `tailwind-merge` package directly (`twMerge('text-ground','text-body')`
  → both classes now present; a genuine color-color conflict still
  resolves correctly; unrelated conflict groups — padding, standard
  Tailwind colors, standard Tailwind font sizes, display — all
  unaffected). Live in browser: both the showcase page's CTA band and
  the blog's `ArticleCTA` now render with correct, distinct text/
  background colors on every button.
