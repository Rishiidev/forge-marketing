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
