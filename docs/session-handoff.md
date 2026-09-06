# Forge Marketing — Session Handoff

> Read this file first. It is written so a new Claude Code session, with
> no access to any prior conversation, can pick up this repository safely.
> For full architecture/business-rule/file-level detail, see the
> companion reference: [`docs/session-state.md`](session-state.md).
>
> Nothing in this file is invented. Every claim is grounded in the git
> status, the current file contents, or `docs/decisions.md`/
> `docs/forge-business-rules.md`. Where something is genuinely unresolved,
> it is listed as unresolved, not guessed at.

Snapshot date: 2026-09-06 (regenerated later the same day — see the
correction note immediately below).

**Correction, this regeneration:** everything below this point was
written as of commit `f72f58d`, describing substantial *uncommitted*
work. That work was in fact committed and built on further —
`git log` shows real history through ADR-020 (`4c215d1`, a pricing
section rebuild) with no session updating this file in between; ADR-020
itself flagged the gap. This regeneration (ADR-021, the zero-cost tools
architecture) corrects the git-state claims below rather than trusting
the old narrative — see the new §16 for what's actually true now. The
original body is otherwise left intact as a historical record of that
earlier checkpoint's real findings (the SEO/security/content audits in
§7–§10 are still accurate as *audits performed*, just not as a
description of current git state).

---

## 1. What the original Forge project contained

Unchanged from every prior handoff — see `docs/session-state.md` §1 for
the full file inventory, and `docs/forge-business-rules.md` for the
exhaustive, cited breakdown of the legacy site's content and its
internal pricing contradictions.

## 2. What has been changed (cumulative, all sessions)

On the `rebuild` branch, in order (full detail: ADR log,
`docs/decisions.md`):

1. Legacy site relocated to `legacy/`, unmodified.
2. Business rules document written.
3. Next.js/TypeScript/Tailwind/MDX architecture scaffolded.
4. Design system built.
5. Conversion architecture document written.
6. Homepage built.
7. Showcase system built (`/showcases`, `/showcases/[slug]`).
8. Forge Free Audit rebuilt as a full self-serve tool (`/audit`).
9. CRM rebuilt as a full adapter (Lead model, 17-stage lifecycle).
10. **The commercial ladder finalized** — ₹5,000/₹15,000/₹25,000
    (Launch/Growth/Pro), set directly by the business owner, resolving
    two of the fourteen open Human Decisions (ADR-011).
11. Post-sale growth architecture — reviews, showcase eligibility,
    referrals (ADR-012), plus a file-backed store fix for it (ADR-013).
12. **The blog and resource system built** — `/blog`, `/blog/[slug]`,
    nine topic clusters, full SEO surface, three real articles (ADR-014).
13. **A real, site-wide button-contrast bug found and fixed** — see §6.

## 3. What has NOT been changed

- **`legacy/` — zero content edits.** Standing project convention.
- **`/tools`** — still an empty registry, still says so honestly.
- **Lead delivery is still not connected to a real destination.**
  `lib/crm.ts` defaults to a console/file-backed provider; no `.env`
  exists. Whether a real provider is configured outside this repo
  (a deployment platform's own env vars) is unknown from here.
- **Analytics is still not connected to any real vendor.**
- **12 of the 14 Human Decisions in `docs/forge-business-rules.md`
  remain open** — HD#1 and HD#2 are now resolved (§9 below); the rest
  (maintenance pricing conflict, revision policy, refund policy,
  referral mechanics/reward, testimonial consent process, showcase
  consent process for future clients, the privacy-policy/code
  discrepancy, retention enforcement, CRM strategy, analytics go/no-go,
  the canonical contact channel, the positioning statement) are not.
- **The customer application** (`app.forge.bruuhh.com`) does not exist.
- **No test suite, no CI.**

## 4. Current architecture

Summarized in `docs/session-state.md` §2; authoritative detail in
`docs/architecture.md`. One-line version, updated: Next.js 15 App
Router + React 19 + TypeScript strict + Tailwind v3 + filesystem MDX
content (now covering blog *and* showcases with real entries), a full
`CrmAdapter` with a post-delivery reviews/referrals loop on top, and a
finalized three-tier commercial ladder — all still behind swappable
provider abstractions that default to safe no-ops/local-only behavior.

## 5. Current business rules

Authoritative source: `docs/forge-business-rules.md`. **Changed this
checkpoint's predecessor session:** HD#1 (canonical funnel) and HD#2
(the ₹25,000 figure) are now marked resolved there, citing ADR-011 —
read the resolution notes directly rather than trusting this summary.
Everything else in that document is unchanged.

## 6. Important decisions made (with rationale) — since the last handoff

Full text in `docs/decisions.md` (ADR-009 through ADR-015). The ones
most likely to matter to whatever comes next:

- **ADR-011:** the business owner directly set the final commercial
  ladder (₹5,000 Launch / ₹15,000 Growth / ₹25,000 Pro) in this
  session — a real resolution, not a working assumption. Differentiation
  between tiers is structural (build approach, page count, revision
  rounds, delivery time, support window), not padded feature lists.
- **ADR-014:** the blog is a real acquisition-channel system now, not a
  placeholder — three real articles, nine-cluster taxonomy, full SEO
  surface, and an explicit `article → relevant tool → audit → Forge`
  CTA chain (never "buy now").
- **ADR-015 — read this one carefully if you touch any dark-background
  button.** `lib/utils.ts` `cn()` had a real, site-wide bug: it silently
  dropped a button's real text color whenever combined with Forge's
  custom `text-{size}` scale (affects `Button`'s `onDark`/
  `onDarkSecondary` variants specifically, which are always used with a
  `size`). This was **not** introduced this session — it affected every
  existing dark CTA band before now, including the showcase page's
  "Visit the live site" button, which was rendering invisible
  (background-colored) text before the fix. Fixed once, centrally, in
  `lib/utils.ts`; verified against the real installed `tailwind-merge`
  package and live in browser on both the showcase and blog CTAs. No
  component needed to change.
- **Recurring convention, still true:** every optional or unconfirmed
  business fact is typed as `null`/`'tbd'`/absent and rendered as an
  honest empty/pending state. This now also covers `REFERRAL_REWARD_CONFIG`
  and `BlogFrontmatter.featuredImage` (never a placeholder image).

## 7. SEO checkpoint audit (this session, explicit ask)

The concern checked: is the blog — meant as an organic acquisition
channel — accidentally noindexed? **Verified: no.**

- No `robots` field is set in `buildMetadata()`'s output for `/blog` or
  `/blog/[slug]` (confirmed by reading `app/blog/page.tsx`,
  `app/blog/[slug]/page.tsx`, and `lib/seo.ts`, then confirmed live —
  `document.querySelector('meta[name="robots"]')` is absent on both
  routes, which defaults to indexable).
- No `middleware.ts` exists in this repo.
- `next.config.mjs`'s `headers()` sets CSP/frame/content-type/referrer/
  permissions headers only — no `X-Robots-Tag` anywhere.
- No `vercel.json` exists at the repository root (only inside `legacy/`,
  which isn't part of the deployed Next.js build).
- `app/robots.ts` (new this session) explicitly `Allow: /`, and only
  disallows `/r/` and `/api/` — both non-content utility routes, not the
  blog.
- `app/sitemap.ts` (new this session) includes `/blog` and all three
  real post URLs, pulled live from `getAllPosts()`.
- The **only** noindex in this codebase is `app/design-system/page.tsx`'s
  `robots: { index: false, follow: false }` — intentional and documented
  (`docs/architecture.md`: "internal only, noindex/unlinked"). **This was
  left untouched, per instruction not to remove an intentionally
  documented noindex.**

**Conclusion: nothing needed to be removed.** The blog was never
noindexed. If a future session finds it noindexed, that would be a new
regression introduced after this checkpoint, not a carryover from this
one.

## 8. Repository safety audit (this session, explicit ask)

- **No unexpected deletions** beyond `content/blog/hello-world.mdx`
  (intentional — see ADR-014, `git rm`'d, matching its own body text's
  instruction to delete it once real content existed, and the identical
  precedent for `example-showcase.mdx` in ADR-008).
- **No secrets added.** No `.env*` file exists anywhere in the repo
  (`find` confirms it). `.gitignore` was extended (not by this specific
  audit, but present and correct) to also exclude `.data/` — the
  file-backed store's on-disk location, which can contain lead PII in
  local dev and must never be committed.
- **No debug or temporary files** found in `git status`.
- **`tsconfig.json`'s diff is cosmetic** — Next.js's own tooling
  reformatted it (multi-line arrays) and added a `.next-verify/types`
  include path from a verification build run earlier in this work;
  functionally equivalent, not a manual edit, not a risk.
- **Nothing has been committed.** `git log` still ends at `f72f58d`. All
  work described in this handoff and its predecessor is sitting
  uncommitted in the working tree — see §12 for the exact file list.

## 9. Content safety audit (this session, explicit ask)

- **No fabricated reviews or testimonials** — grepped the three new blog
  posts and all touched files; none exists. The only quoted reviews in
  the codebase remain the pre-existing, real showcase entries.
- **No fabricated metrics** — no invented percentage, statistic, or
  "studies show" claim in any new content.
- **No unsupported claims** — the blog's advice is general, defensible
  best-practice guidance (matching `forge-business-rules.md` §17/§18's
  existing "specific and checkable, never hype" standard), not a claim
  about Forge's own results.
- **No fake scarcity** — `CAPACITY.status` is still `'tbd'`;
  `CapacityStrip` still renders nothing. Grepped for urgency language
  ("limited time," "only X left," etc.) — none found in any new file.
- **No accidental old pricing** — grepped for every legacy price figure
  (₹9,999, ₹24,999, ₹30,000, the flat ₹1,999/mo maintenance mention)
  across `app/`, `components/`, `lib/`, `content/`; every hit is either a
  CSS offset (`-9999px`), a placeholder phone-number format
  (`+91 99999 99999`), or a documentation citation of the legacy
  conflict — never a live price. `lib/constants.ts` currently prices
  Launch/Growth/Pro at ₹5,000/₹15,000/₹25,000 and Maintenance at
  ₹1,499/₹3,999/₹7,999, matching ADR-011 exactly.

## 10. The tailwind-merge fix — re-verified at this checkpoint

See `docs/session-state.md` §7 for the full writeup. Re-confirmed at
this checkpoint, freshly, against the actual installed `tailwind-merge`
package and live in browser:

- `twMerge('text-ground', 'text-body')` → both classes present (was:
  `text-body` alone, color silently dropped).
- A genuine color-color conflict (`text-ground`, `text-ink`) still
  resolves to the last one — real conflict detection wasn't loosened.
- A genuine size-size conflict (`text-body`, `text-body-sm`) still
  resolves to the last one.
- Unrelated conflict groups (padding, standard Tailwind background
  colors, standard Tailwind font sizes, display) all unaffected.
- Live in browser: every `onDark`-variant button on
  `/showcases/smile-care-dental` (2× "Get your free audit", "Visit the
  live site ↗") and on `/blog/optimize-google-business-profile-local-search`
  ("Get your free audit," the `ctaHref` secondary link) now has
  genuinely distinct, correct text/background colors.

## 11. Current branch

`rebuild`. `main` holds the untouched baseline import only.

## 12. Latest commit — and everything sitting uncommitted on top of it

```
f72f58d docs: write session handoff and state snapshot
```

Nothing has been committed since. `git status --short` at this
checkpoint:

**Modified:**
`.gitignore`, `app/actions.ts`, `app/audit/page.tsx`,
`app/blog/page.tsx`, `app/blog/[slug]/page.tsx`,
`app/design-system/page.tsx`, `app/maintenance/page.tsx`,
`app/websites/page.tsx`, `components/blog/BlogCard.tsx`,
`components/blog/BlogList.tsx`, `components/forms/useLeadForm.ts`,
`components/pricing/PriceCard.tsx`,
`components/pricing/WebsiteTierPage.tsx`, `docs/architecture.md`,
`docs/conversion-architecture.md`, `docs/decisions.md`,
`docs/forge-business-rules.md`, `lib/analytics.ts`, `lib/constants.ts`,
`lib/crm.ts`, `lib/seo.ts`, `lib/utils.ts`, `tsconfig.json`

**Deleted (staged):** `content/blog/hello-world.mdx`

**Untracked (new files):** `app/r/`, `app/robots.ts`, `app/sitemap.ts`,
`components/audit/AuditInputForm.tsx`,
`components/audit/AuditLeadCaptureForm.tsx`,
`components/audit/AuditProcessing.tsx`,
`components/audit/AuditResultView.tsx`, `components/audit/AuditTool.tsx`,
`components/blog/ArticleBody.tsx`, `components/blog/ArticleCTA.tsx`,
`components/blog/ArticleHeader.tsx`, `components/blog/BlogViewTracker.tsx`,
`components/blog/RelatedArticles.tsx`, `components/blog/TableOfContents.tsx`,
`components/marketing/Breadcrumbs.tsx`,
`components/pricing/PricingComparisonTable.tsx`, `content/blog/`
(3 real posts), `docs/crm.md`, `lib/audit.ts`, `lib/blog.ts`,
`lib/file-store.ts`, `lib/rate-limit.ts`, `lib/referrals.ts`,
`lib/reviews.ts`, `lib/validation.ts`

This is the accumulated, uncommitted output of the Forge Free Audit
build, the CRM/referrals/reviews rebuild, the commercial-ladder pricing
pages, and the blog system — four features deep with zero commits
between them. **Recommended commit message is in this checkpoint's own
report to the user; whoever picks this up next should commit before
adding anything else**, to get a real rollback point.

## 13. Current build/test status

Re-verified at this checkpoint:

- `npm run typecheck` — clean.
- `npm run lint` — clean ("No ESLint warnings or errors"; only the
  standing `next lint` deprecation notice).
- `npm run build` — succeeds, 22/22 routes generated (`/blog`,
  `/sitemap.xml`, `/robots.txt` are new since the last handoff), no
  warnings.
- No automated test suite exists. Manual browser verification performed
  this checkpoint: noindex/canonical/OpenGraph/Twitter/structured-data
  checks on `/blog` and `/blog/[slug]`, internal-link resolution
  (fetched every linked URL, all 200), and computed-style contrast
  checks on both the showcase and blog dark CTAs.

## 14. Exact next recommended action

**Commit this work before starting anything else.** Four features'
worth of changes sitting uncommitted (Forge Free Audit, CRM/referrals/
reviews, pricing ladder, blog system) is real risk with no offsetting
benefit — a bad edit from here has nothing to roll back to. See the
checkpoint report's recommended commit message.

After that, unchanged from before: the highest-leverage remaining gap is
still **HD#13 — no real contact channel exists**, which means no
submitted lead can reach a person in any deployed environment regardless
of how complete the funnel looks. Get the business owner to resolve
HD#13 (contact channel) and HD#11 (CRM destination) before the next
feature pass, or continue with additive work that doesn't require a
Human Decision (e.g. a first real `/tools` entry).

## 15. Known risks

- **Four uncommitted features deep, zero commits.** The single biggest
  operational risk right now — not a code defect, a process one.
- **Silent lead loss in any real deployment** — unchanged from every
  prior handoff; still true.
- **Two unresolved pricing conflicts remain**: HD#3 (maintenance
  ₹1,999/mo vs. the three-tier structure) and — separately — the
  now-*resolved* HD#1/HD#2 mean any old external reference to ₹9,999/
  ₹24,999/₹30,000 is stale as of ADR-011.
- **A live, uncorrected compliance-adjacent discrepancy** (HD#9,
  privacy-policy vs. code) — unchanged, still open.
- **If a future session adds a real `.env` or real analytics/CRM
  vendor, re-run this checkpoint's noindex and content-safety audits** —
  nothing here currently depends on that decision, but a rushed real
  integration is exactly the kind of change that could accidentally
  introduce a `robots` header or a fabricated metric.
- **CI still doesn't exist**, but `npm run test` does now (§16) — a
  future session should wire it into a CI workflow rather than leaving
  it manual-only the way `typecheck`/`lint`/`build` still are.

---

## 16. Actually-current state (regenerated 2026-09-06, later in the day)

Everything above this section describes the `f72f58d` checkpoint and is
historically accurate for that point in time, but **not** for "right
now" — see the correction note at the top of this file. What's true as
of this regeneration:

- **Current branch: `main`.** `git log --oneline` shows 22 real commits,
  `272c836` (baseline import) through `4c215d1` (ADR-020, pricing
  section rebuild), all on `main`. `rebuild` still exists as a branch
  (`origin/rebuild` too) but no longer describes where active work
  happens — `docs/deployment.md`'s branch-promotion narrative should be
  re-verified by whoever next touches deployment, not trusted as-is.
- **The site has shipped past everything this file previously
  described as "not yet done":** a Vercel preview deployment exists
  (`docs/deployment.md`, ADR-017), a real production-blocking CVE was
  found and fixed (ADR-018), a real Vercel-specific 500 was found and
  fixed (ADR-019), and the homepage pricing section was rebuilt for
  visual hierarchy (ADR-020). Business-decision gaps (HD#13 contact
  channel, HD#11 CRM destination, HD#3 maintenance pricing conflict,
  etc.) remain genuinely open — nothing in the commits since `f72f58d`
  resolved any of them.
- **This session's own work (ADR-021):** the zero-cost tools
  architecture — `docs/tools-cost-policy.md`, `docs/tool-cost-matrix.md`,
  `lib/tools/types.ts`, `lib/tools/cost-policy.ts`,
  `lib/tools/__tests__/cost-policy.test.ts`, and the first automated
  test suite this repository has had (`npm run test`, Vitest). No
  individual tool was built — `lib/constants.ts` `TOOLS` is still `[]`,
  per explicit instruction for this phase. `components/tools/ToolCard.tsx`,
  `app/tools/[slug]/page.tsx`, and `app/sitemap.ts` were updated only to
  honor the new type contract, not redesigned.
- **`npm run typecheck`/`lint`/`test`/`build` all pass** as of this
  regeneration (test: 13/13 new tests; build: 22/22 static pages,
  unchanged route count).
- **This session's changes are uncommitted as this file is written.**
  Recommended commit message: `docs: establish zero-cost tools
  architecture` (matches the instruction that requested this phase).
  Everything through `4c215d1` is already committed — this is a clean,
  small, single-purpose commit on top of a clean tree, not another
  multi-feature backlog like the one this file originally described.

**Exact next recommended action, updated:** commit this session's work,
then either (a) build the first real `/tools` entry against the new
architecture — the audit-tool pattern and the quote-calculator candidate
in `docs/tool-cost-matrix.md` are the two most-grounded starting points
— or (b) continue chasing the still-open Human Decisions (HD#13/HD#11
remain the highest-leverage gaps, unchanged from every prior handoff).
Do not start (a) without first re-reading `docs/tools-cost-policy.md` in
full — this file only summarizes it.
