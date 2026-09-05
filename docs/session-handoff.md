# Forge Marketing — Session Handoff

> Read this file first. It is written so a new Claude Code session, with
> no access to any prior conversation, can pick up this repository safely.
> For full architecture/business-rule/file-level detail, see the
> companion reference: [`docs/session-state.md`](session-state.md).
>
> Nothing in this file is invented. Every claim is grounded in the git
> history, the current file contents, or `docs/decisions.md`/
> `docs/forge-business-rules.md`. Where something is genuinely unresolved,
> it is listed as unresolved, not guessed at.

Snapshot date: 2026-09-05. Written at the end of a session that built the
showcase system (`/showcases`, `/showcases/[slug]`) and, per explicit
instruction, made **no further application changes** — this handoff and
its companion `docs/session-state.md` are the only output of that final
step.

---

## 1. What the original Forge project contained

A static HTML marketing site (9 pages, inline CSS/JS, two Vercel
serverless functions for lead capture) selling "turn your Google
Business Profile into a website" to Indian local businesses, across
**multiple inconsistent pricing structures** depending on which page a
visitor landed on. Fully preserved, untouched, at
[`legacy/`](../legacy/) — see `docs/session-state.md` §1 for the file
inventory, and `docs/forge-business-rules.md` for the exhaustive,
cited breakdown of what it actually said and where it contradicted
itself.

## 2. What has been changed

This repository is a from-scratch Next.js rebuild of that site, built up
over 8 commits on the `rebuild` branch (baseline → this session). In
order:

1. Legacy site relocated to `legacy/`, unmodified (ADR-003).
2. `docs/forge-business-rules.md` written — the cited business source of
   truth (see `docs/session-state.md` §3).
3. Next.js/TypeScript/Tailwind/MDX architecture scaffolded (ADR-001,
   ADR-002).
4. Design system built: tokens, primitives, `/design-system` internal
   preview route (ADR-005).
5. `docs/conversion-architecture.md` written — funnel design, objection
   handling, CRM lifecycle, analytics taxonomy (ADR-006).
6. Homepage built (12 sections, real showcase content introduced,
   pricing tiers renamed Launch/Growth/Pro, CTA copy unified) (ADR-007).
7. **This session:** showcase system built — `/showcases`,
   `/showcases/[slug]`, `lib/showcases.ts`, structured data, the
   `showcase_viewed` event wired, the two prior ad hoc showcase cards
   consolidated into one (ADR-008).

See `docs/decisions.md` for the full ADR log (append-only — do not
rewrite past entries; see §7 below).

## 3. What has NOT been changed

- **`legacy/` — zero content edits since it was moved.** Every file in
  it is byte-for-byte what shipped originally, just relocated.
- **`/tools`** — route exists, renders "nothing is live here yet"
  honestly. `lib/constants.ts` `TOOLS` is an empty array. No tool has
  been built.
- **`/blog`** — route and MDX pipeline work, but only one placeholder
  post exists (`content/blog/hello-world.mdx`), explicitly labeled as
  not real Forge content.
- **Lead delivery is not connected to a real destination.** `lib/crm.ts`
  defaults to a console-only provider; no `.env` file exists in this
  repo and no `CRM_PROVIDER` is set. A submitted lead is only logged to
  the server console in this environment. Whether a real provider is
  configured outside this repo (e.g. in a deployment platform's own env
  vars) is unknown from here — do not assume it is.
- **Analytics is not connected to any real vendor.** `lib/analytics.ts`
  is a console-only no-op by design, per the unresolved HD#12 and the
  legacy site's public "no third-party trackers" promise.
- **None of the 14 Human Decisions in `docs/forge-business-rules.md`
  have been resolved by the business owner.** Two have been treated as
  *working assumptions* for planning/building purposes only (HD#1: the
  ₹5,000 entry-tier funnel; HD#8: the three existing showcase entries'
  consent) — both are explicitly flagged in the source documents as
  still needing real sign-off, not settled.
- **The customer application** (`app.forge.bruuhh.com`) does not exist
  in any form. Out of scope for every phase of this rebuild so far.
- **No test suite, no CI** exists. Verification has been manual
  (typecheck/lint/build + browser checks) each session.

## 4. Current architecture

Summarized in `docs/session-state.md` §2; authoritative detail in
`docs/architecture.md`. One-line version: Next.js 15 App Router + React
19 + TypeScript strict + Tailwind v3 + filesystem MDX content, Server
Components by default, one Server Action (`app/actions.ts`) behind every
lead form, CRM and analytics both behind swappable provider
abstractions that currently default to safe no-ops.

## 5. Current business rules

Authoritative source: `docs/forge-business-rules.md`. Do not
paraphrase pricing, policy, or claims from memory or from this handoff
— read that file directly before writing or changing anything
customer-facing. `docs/session-state.md` §3 lists its structure and
reproduces the full 14-item Human Decisions list for quick scanning.

## 6. Important decisions made (with rationale)

Full text in `docs/decisions.md` (ADR-000 through ADR-008). The ones
most likely to matter to whatever comes next:

- **ADR-003:** legacy code is moved, never edited or deleted. This is a
  standing project convention, not a one-time choice — it applies to
  any future session too.
- **ADR-005:** design tokens live in one file (`lib/design-tokens.ts`)
  consumed by both Tailwind and the `/design-system` preview, so they
  cannot drift apart. Tailwind's default `fontSize` scale was replaced,
  not extended, to force every component through the named type scale.
- **ADR-007:** the three real client names/metrics on the homepage and
  in showcases were carried forward under the reasoning that they were
  already public on the live legacy site before this rebuild touched
  them — **this covers only those three existing entries**, not a
  general policy for showcasing future clients (HD#8 remains open for
  that).
- **ADR-008:** one `ShowcaseCard` component now serves both the
  homepage and `/showcases` (replacing two overlapping components);
  showcase publishability is gated on four required fields
  (`name`/`industry`/`websiteUrl`/`description`), not a hardcoded slug
  exclusion list — this is what lets the system scale to more entries
  without page-level code changes.
- **Recurring convention, not one ADR:** every optional or unconfirmed
  business fact is typed as `null`/`'tbd'`/absent in code and rendered
  as an honest empty/pending state — never filled with a plausible-
  looking placeholder. This applies to contact info, the ₹25,000 tier,
  capacity numbers, and every showcase field. Preserve this pattern.

## 7. Important unresolved decisions

The 14 Human Decisions in `docs/forge-business-rules.md` (full list in
`docs/session-state.md` §3). The single most urgent one for anyone
picking this up:

> **HD#13 — canonical contact channel.** No real WhatsApp number or
> support email exists anywhere in the source. Until the business owner
> supplies one, `SITE.whatsappNumber`/`SITE.supportEmail` stay `null`,
> the WhatsApp float button stays invisible, and — more importantly —
> **there is no configured way for a submitted lead to reach a person**
> (see §3 above). This blocks the site from functioning as a working
> funnel in production, independent of how much page content exists.

Also unresolved and worth flagging proactively if the next session
touches pricing or maintenance copy: HD#2 (₹25,000 tier), HD#3
(maintenance pricing — two conflicting structures), HD#9 (a live,
uncorrected discrepancy between `privacy.html`'s claims and what
`legacy/api/submit.js` actually does — this is a compliance-adjacent
issue, not just a content gap).

## 8. Files created (this rebuild, cumulative since the legacy baseline)

Everything under `app/`, `components/`, `lib/`, `content/`, and the
`docs/*.md` files other than `docs/legacy-readme.md` (which is a
verbatim copy of the original README, not new content) is new,
rebuild-authored code. Full directory trees are in
`docs/session-state.md` §2. Root-level config files created for the
Next.js toolchain: `next.config.mjs`, `tailwind.config.ts`,
`tsconfig.json`, `postcss.config.js`, `.eslintrc.json`, `package.json`,
`package-lock.json`, `next-env.d.ts`, `.gitignore`.

**Created this session specifically:**
- `lib/showcases.ts`
- `components/showcases/ShowcaseViewTracker.tsx`
- `docs/session-state.md`, `docs/session-handoff.md` (this pair)

## 9. Files modified

**Relative to the legacy baseline:** only `README.md` was rewritten in
place (the original content was preserved verbatim as
`docs/legacy-readme.md` before the rewrite — see ADR in
`docs/decisions.md` around the baseline-scaffold commit). Everything
else in `legacy/` was moved, not edited.

**This session specifically** (full list and rationale in the ADR-008
entry of `docs/decisions.md`):
`app/page.tsx`, `app/showcases/page.tsx`, `app/showcases/[slug]/page.tsx`,
`app/design-system/page.tsx`, `components/showcases/ShowcaseCard.tsx`,
`components/showcases/ShowcaseGrid.tsx`,
`components/marketing/TransformationCompare.tsx`,
`content/showcases/smile-care-dental.mdx`,
`content/showcases/asquare-venture.mdx`,
`content/showcases/we-health-care-diagnostic.mdx`,
`docs/architecture.md`, `docs/conversion-architecture.md`,
`docs/decisions.md`, `README.md` (Status section, in the step that
produced this handoff).

**Deleted this session** (rationale in ADR-008 — superseded, not
arbitrary cleanup): `components/showcases/ShowcaseProofCard.tsx`,
`components/showcases/CaseStudyCard.tsx`,
`content/showcases/example-showcase.mdx`.

## 10. Files that must not be modified without explicit approval

- **`legacy/**`** — never edit or delete. If something there looks
  wrong, fix the rebuilt equivalent and/or note the discrepancy in
  `docs/forge-business-rules.md`; do not touch the source file. This
  has been a standing instruction for the entire project, not a
  one-session preference.
- **`docs/forge-business-rules.md`** — the business source of truth.
  Only add to it when a new sourced fact is found in the legacy code, or
  when a Human Decision is genuinely resolved by the business owner
  (with that resolution noted explicitly, e.g. the pattern used for
  HD#1 in `docs/conversion-architecture.md`). Never edit it to make an
  unresolved decision look settled.
- **`docs/decisions.md`** — append-only. Do not rewrite or delete a past
  ADR's Context/Decision/Consequences, even if a later change supersedes
  it — log the supersession as a new ADR that references the old one
  (see how ADR-008 handles ADR-007's `ShowcaseProofCard`).
- **Any `null`/`'tbd'`/empty value in `lib/constants.ts`**
  (`SITE.supportEmail`, `SITE.whatsappNumber`, the `'25000'` tier's
  `price`, `CAPACITY`'s numbers and `status`, `TOOLS`) — do not fill
  these with a plausible-looking value. They are `null`/`'tbd'` because
  no real, confirmed number exists. Only change them when a Human
  Decision is actually resolved, and cite where the new value came from.
- **Do not commit a real `.env`/`.env.local`** or any real CRM/analytics
  credential into this repository. `.gitignore` already excludes
  `.env*`; keep it that way.

## 11. Current branch

`rebuild` (git command: `git branch --show-current` confirms this as of
the snapshot date above). `main` holds the untouched baseline import
only — do not merge into `main` without the user's explicit instruction.

## 12. Latest commit

```
5fb4077 Build the Forge showcase system
```
Pushed to `origin/rebuild` (`https://github.com/Rishiidev/forge-marketing.git`).
Working tree is clean as of this snapshot — no uncommitted changes
except the two handoff files and the `README.md` Status update this
step is about to add.

Full recent history:
```
5fb4077 Build the Forge showcase system
688f832 feat: build the Forge homepage
d00a41d docs: write conversion architecture
b85bc03 feat: build the Forge design system
8068d4f feat: scaffold Next.js marketing site architecture
f99c480 chore: relocate legacy static site into legacy/
19f6387 docs: write Forge business strategy document
0440bb0 docs: add rebuild scaffold, preserve original README
272c836 Baseline: import existing Forge marketing site, unmodified
```

## 13. Current build/test status

Verified immediately before writing this handoff:

- `npm run typecheck` — clean.
- `npm run lint` — clean ("No ESLint warnings or errors"; only a
  deprecation notice that `next lint` will be removed in Next.js 16).
- `npm run build` — succeeds, all 18 routes generated (static or SSG via
  `generateStaticParams`), no warnings.
- No automated test suite exists to run. Manual browser verification was
  performed for the showcase system this session (desktop + mobile,
  console/network clean, analytics events firing, live-site links
  correct) — see the ADR-008 commit message for the exact checklist.

## 14. Exact next recommended action

**Do not start new page/feature work before addressing this.** The
highest-leverage next step is not code — it is closing the gap between
"the funnel looks complete" and "the funnel actually delivers a lead to
a person." Concretely:

1. Get the business owner to resolve **HD#13** (a real WhatsApp number
   and/or support email) and **HD#11** (what the CRM destination
   actually is — Supabase directly, an external CRM, or a webhook
   target). Until at least one of these is answered, set
   `CRM_PROVIDER=webhook` and `CRM_WEBHOOK_URL=...` (or leave it on
   `console` deliberately, if this is still a preview/demo phase) so
   whoever deploys this next knows the actual state rather than
   assuming leads are being delivered somewhere.
2. If business input isn't available yet and engineering work should
   continue anyway, the safest next increment is a content pass on
   `/blog` (real posts) or `/tools` (a first real tool) — both are
   additive, don't require resolving a Human Decision, and were
   explicitly flagged as not-yet-real in `docs/session-state.md` §2.
3. Whichever is chosen, follow the established pattern: read
   `docs/forge-business-rules.md` and `docs/architecture.md` first,
   cite sources for any new fact, mark anything unconfirmed as TBD
   rather than guessing, and log any non-trivial choice as a new ADR in
   `docs/decisions.md`.

## 15. Known risks

- **Silent lead loss in any real deployment.** If this is deployed
  without `CRM_PROVIDER` set, every lead is only logged to a server
  console that likely no one is watching — it will look like the funnel
  works (form submits successfully, user sees a success state) while
  actually delivering nothing to Forge. This is the single biggest risk
  in the current state of the repository.
- **Two unresolved pricing conflicts** (HD#3 maintenance, and the
  underlying ₹5,000-vs-₹9,999 funnel question behind HD#1) mean any
  copy or sales conversation based on the currently-coded numbers could
  contradict a number the business owner intends to use elsewhere.
- **A live, uncorrected compliance-adjacent discrepancy** (HD#9):
  `legacy/privacy.html`'s stated data-sharing and no-scoring claims do
  not match what `legacy/api/submit.js` actually does. This hasn't been
  fixed in the rebuild because the rebuild doesn't yet have a privacy
  page or a wired lead-scoring mechanism — but whoever writes the
  rebuild's privacy policy needs to resolve this consciously, not copy
  `privacy.html`'s text forward unchanged.
- **`docs/architecture.md`, `docs/conversion-architecture.md`, and
  `docs/forge-business-rules.md` are living documents that this
  session kept in sync with the code.** A future session that changes
  code without updating the relevant doc will cause exactly the kind of
  drift this project has been structured to avoid. Treat doc updates as
  part of the change, not an afterthought.
- **No CI.** Nothing currently prevents a future commit from breaking
  `typecheck`/`lint`/`build` before it reaches `main`. Verification is
  only as good as whoever runs it manually.
