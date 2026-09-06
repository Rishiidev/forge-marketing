# Forge Free Tools — Engine Architecture

> This document describes the reusable engine a `/tools` entry is built
> on — not any individual tool (none exists yet; `lib/constants.ts`
> `TOOLS` is still `[]`, per explicit instruction for this phase). Read
> [`docs/tools-cost-policy.md`](tools-cost-policy.md) first — that's the
> policy this engine enforces; this document is the implementation.
> [`docs/tool-security.md`](tool-security.md) covers the SSRF/fetch
> contract in full detail; this document only summarizes it.
> [`docs/tool-cost-matrix.md`](tool-cost-matrix.md) is where each real or
> candidate tool gets evaluated against both.

## Goal

Adding a new deterministic free tool should take minimal code and
automatically receive: consistent UI, validation, a loading state, a
progress state, result rendering, findings, error handling, analytics,
a contextual CTA, SEO metadata, accessibility, security, caching hooks,
related-tools linking, and a path back into the existing audit/lead
funnel. Concretely: **a tool author writes one object** (a
`ToolDefinition` — name, description, category, input fields, and a
`run()` function) and drops it into `lib/constants.ts` `TOOLS`. Every
list above is `app/tools/[slug]/page.tsx` + `ToolPageShell`'s job, not
the tool author's.

## File map

```
lib/tools/
  types.ts        The full type contract — see "The ToolDefinition contract" below.
  registry.ts      Central lookups over lib/constants.ts TOOLS: getAvailableTools(),
                    getToolBySlug(), getAvailableToolBySlug(), getToolsByCategory(),
                    getRelatedTools(). Domain layer atop constants.ts, same relationship
                    lib/blog.ts/lib/showcases.ts already have to lib/content.ts.
  validation.ts    Generic per-field validation driven by a tool's own `inputFields` —
                    reuses lib/validation.ts's isValidEmail/normalizeUrl.
  security.ts      SSRF-safe URL validation + safeFetch(). Server-only. Full contract:
                    docs/tool-security.md.
  execution.ts     The state machine (nextState()) and the run orchestrator
                    (executeTool()) that calls a tool's run() and normalizes whatever
                    it throws.
  results.ts       The five finding builders (verifiedFinding/inferredFinding/
                    unavailableFinding/notCheckedFinding/failedFinding) — the honesty
                    contract, in code. buildToolResult(), computeOverallStatus(),
                    summarizeByCategory().
  analytics.ts     One function per tools-engine event (tool_viewed, tool_started, …)
                    plus captureAttribution() (utm_*/landing page/referrer).
  cache.ts         Zero-cost, file-backed result cache (lib/file-store.ts pattern).
                    Server-only.
  errors.ts        toToolError()/makeToolError() — normalizes anything a tool's run()
                    throws into a typed, visitor-safe ToolError.
  cost-policy.ts   Zero-cost policy enforcement (docs/tools-cost-policy.md) —
                    findForbiddenDependencies(), validateToolDefinition(). Predates this
                    phase; extended here to also check the new required fields below.
  __tests__/       cost-policy, security, results, registry — 60 tests, all zero-network
                    except where an IP literal is checked directly (no DNS/HTTP call).

components/tools/
  ToolPageShell    The one orchestrator a tool page mounts. Owns state, wires everything
                    else below together. See "The page shell" below.
  ToolHeader       Category eyebrow + name + description + intent, via PageHero.
  ToolInput        Schema-driven form from `inputFields` — TextField/SelectField/
                    Textarea, honeypot included, validated via lib/tools/validation.ts.
  ToolProgress     The 'processing' state — honest copy, optional named steps.
  ToolResult       The 'success'/'partial' state container — summary, ToolScore,
                    ToolFindingList, ToolCTA.
  ToolFinding      One finding — severity badge + resultCategory badge (see "Result
                    categories" below), detail, optional recommendation link.
  ToolFindingList  Maps ToolResult.findings to ToolFinding, or ToolEmptyState if empty.
  ToolScore        Plain-language count by resultCategory — never a single fabricated
                    numeric score, matching lib/audit.ts's existing "no bare score" rule.
  ToolStatus       Screen-reader-only aria-live announcement of the current state.
  ToolError        The 'error' terminal state — role="alert", retry button if
                    error.retryable.
  ToolEmptyState   Generic "honestly nothing here" state (empty tool grid, zero findings).
  ToolCTA          The tool's own primaryCTA/secondaryCTA, wired to tool_cta_clicked.
  RelatedTools     Grid of lib/tools/registry.ts getRelatedTools() results, reusing
                    ToolCard — same pattern as components/blog/RelatedArticles.tsx.
  ToolMethodology  "How this works" — the tool's data sources translated into honest,
                    plain-language copy (never the internal cost-classification enum).
  ToolFAQ          Thin wrapper around components/marketing/FAQ.
  ToolCard/ToolGrid Existing components (predate this phase), updated to the new
                    ToolDefinition shape and to route through registry.ts.
```

## The end-to-end flow

```
USER
  ↓
TOOL PAGE            app/tools/[slug]/page.tsx — resolves an *available* tool via
  ↓                  lib/tools/registry.ts, renders breadcrumbs + JSON-LD + ToolPageShell.
VALIDATION           lib/tools/validation.ts validateToolInput(), driven by the
  ↓                  tool's own inputFields — required/maxLength/email/url/select checks,
  ↓                  plus a honeypot check in components/tools/ToolInput.tsx.
SERVER ANALYSIS      The tool's own run() — lib/tools/execution.ts executeTool() calls
  ↓                  it, catching anything it throws. A run() that needs to fetch a
  ↓                  visitor-supplied URL uses lib/tools/security.ts's safeFetch()
  ↓                  (docs/tool-security.md); a run() that's pure internal logic
  ↓                  (like lib/audit.ts) needs none of that.
NORMALIZED RESULT    lib/tools/results.ts buildToolResult() — every finding tagged
  ↓                  with an honest resultCategory (see below); overallStatus derived,
  ↓                  never self-reported by the tool.
CACHE                lib/tools/cache.ts, optional, server-only, file-backed — a tool's
  ↓                  run() calls getCachedResult()/setCachedResult() itself; the engine
  ↓                  doesn't force caching on every tool (docs/tools-cost-policy.md §F).
RESULT UI            components/tools/ToolResult.tsx — summary, ToolScore,
  ↓                  ToolFindingList.
CONTEXTUAL CTA       components/tools/ToolCTA.tsx — the tool's own primaryCTA/
  ↓                  secondaryCTA, never a generic upsell (see below).
AUDIT / WHATSAPP /   The CTA's href — almost always AUDIT_HREF (lib/constants.ts),
LEAD                 sometimes a specific website tier — routes the visitor into the
                     existing funnel (docs/conversion-architecture.md), which already
                     ends at the audit → CRM → WhatsApp/lead path. This engine adds no
                     new lead-capture mechanism; it feeds the one that already exists.
```

## The `ToolDefinition` contract

Every field a tool declares (`lib/tools/types.ts`), and what building it
unlocks automatically:

| Field | Purpose | What it drives |
|---|---|---|
| `slug`, `name` | Identity | Route (`/tools/[slug]`), page title, card |
| `shortDescription` | One line | ToolCard, RelatedTools, SEO fallback |
| `description` | Longer intro | ToolHeader |
| `category` | One of 7 fixed categories | Eyebrow label, `getToolsByCategory()`, related-tools fallback |
| `intent` | One sentence, visitor's-eye view | ToolHeader's supporting line |
| `inputType` | `'url' \| 'form' \| 'business-profile'` | Documents the overall shape (informational — `inputFields` drives the actual form) |
| `inputFields` | Field schema | ToolInput's entire form, plus its validation |
| `run` | The analysis itself | Called by `executeTool()`; the only field a tool author writes real logic in |
| `status` | `'available' \| 'planned' \| 'unavailable' \| 'future-paid'` | Whether the tool has a live route at all (§I below) |
| `availability`, `costProfile`, `dataSources`, `capabilities`, `securityPolicy` | The zero-cost policy shape | Enforced by `lib/tools/cost-policy.ts` `validateToolDefinition()` — see docs/tools-cost-policy.md |
| `seo` | `{title, description, ogImage?}` | `generateMetadata()` in the `[slug]` page |
| `relatedTools` | Slugs | `RelatedTools`, via `registry.ts` `getRelatedTools()` |
| `primaryCTA`, `secondaryCTA` | `{headline, description, label, href, location}` | `ToolCTA` — see "Contextual CTA" below |
| `faq` | Optional Q&A pairs | `ToolFAQ` (renders nothing if absent) |
| `methodology` | Optional free-form "how this works" copy | `ToolMethodology`, alongside the honest data-source list |

`validateToolDefinition()` (`lib/tools/cost-policy.ts`) checks every one
of these is present and internally consistent (e.g. a `select` field
must have `options`; `primaryCTA` must have a `headline`/`label`/`href`;
a `future-paid` tool can never have `status: 'available'`) — a tool
missing something fails `npm run test`, not a code review someone might
skip.

## The state machine

`idle → validating → processing → success | partial | error`, driven
exclusively through `lib/tools/execution.ts` `nextState()` — a
component never sets an arbitrary `ToolExecutionState` directly, so an
invalid transition can't slip in through a future edit.

```
idle ──submit──> validating ──ok──> processing ──> success
  ^                  │                   │            │
  │                  └──invalid──> error │            ├──> partial
  │                                       └──throws──> error
  └────────────────── retry ─────────────────────────┘
```

- **idle/validating**: `ToolInput` is shown. Validation runs
  synchronously (`lib/tools/validation.ts`); a failure goes straight to
  `error` with a specific, field-referencing message — the tool's own
  `run()` is never called on bad input.
- **processing**: `ToolProgress`. The default copy describes what's
  actually happening ("Running the check…") — never implies a live scan
  that isn't occurring, matching `components/audit/AuditProcessing.tsx`'s
  existing honesty convention.
- **success/partial**: `ToolResult`. `partial` happens when
  `computeOverallStatus()` (`lib/tools/results.ts`) finds any `'failed'`
  finding — the visitor still sees everything that *did* work, plus a
  plain note about what didn't. An honest `'unavailable'`/`'not_checked'`
  finding does **not** cause `partial` — only an errored check does.
- **error**: `ToolError`, `role="alert"`. Shows a retry button only when
  `error.retryable` is true (`lib/tools/errors.ts` — timeouts and
  unknown failures are retryable; a validation failure isn't, since
  retrying identical bad input changes nothing).

## Result categories — the honesty contract

**Critical, enforced in code, not just by convention**
(`lib/tools/__tests__/results.test.ts`): a self-reported or
heuristically-inferred fact is never presented as `'verified'`.

| Category | Meaning | Builder |
|---|---|---|
| `verified` | The tool directly confirmed this itself | `verifiedFinding()` |
| `inferred` | Derived from a heuristic/self-report/indirect signal — plausible, not confirmed | `inferredFinding()` |
| `unavailable` | No zero-cost way exists to check this — honestly absent, never guessed | `unavailableFinding()` |
| `not_checked` | In scope, but this run didn't check it (e.g. an optional field the visitor skipped) | `notCheckedFinding()` |
| `failed` | The check was attempted and errored — distinct from `unavailable`, which never attempts | `failedFinding()` |

A tool author calls one of these five named functions
(`lib/tools/results.ts`) to build every finding — never constructs a
`ToolFinding` object by hand with a bare string. `ToolFinding.tsx`
renders `resultCategory` as its own, always-visible badge, separate from
the severity badge, and only `'verified'` ever gets the success/green
tone — so a visitor can always tell, at a glance, what was actually
checked versus estimated.

## Contextual CTA

Never a generic upsell reused everywhere. Each tool declares its own
`primaryCTA`/`secondaryCTA` (`{headline, description, label, href,
location}`), tied to what it actually found:

- An SEO tool: headline *"Want us to fix this?"* → the free audit.
- A performance tool: headline *"Want a faster site?"* → the free audit
  or a website tier.
- A local-signals tool: headline *"Want your business information fixed
  across your website?"* → the free audit.

`ToolCTA.tsx` renders the headline/description in the existing dark
`CTA` band, the `label` as the button text, and fires
`tool_cta_clicked` with the tool's `slug` and the CTA's `location` —
the same `location`-tagging convention `TrackedCtaLink` already uses
site-wide. The `href` is almost always `AUDIT_HREF`
(`lib/constants.ts`) — the one step every visitor can take regardless
of which tool they used — sometimes a specific website tier, matching
the existing `article → relevant tool → audit → Forge` chain
`components/blog/ArticleCTA.tsx` already establishes for blog posts.

## Analytics

One function per event (`lib/tools/analytics.ts`), each requiring
`slug` first so every call site reads the same way:

`tool_viewed` (page mount) → `tool_started` (valid submission begins) →
`tool_validation_failed` (bad input) → `tool_processing_started` →
`tool_completed` / `tool_partial` / `tool_failed` → `tool_result_engaged`
(a finding's recommendation link clicked) → `tool_cta_clicked`.

`captureAttribution()` reads `utm_source`/`utm_medium`/`utm_campaign`/
`utm_content`/`utm_term` from the URL, plus `landing page`
(`window.location.pathname`) and `referrer` (`document.referrer`) —
passed into every `run()` call via `ToolRunContext.attribution`, the
same fields `components/audit/AuditLeadCaptureForm.tsx` already reads
inline, centralized here so a new tool doesn't have to re-derive them.

## Adding a new tool — the minimal path

1. Write a `ToolDefinition` (probably in its own `lib/tools/<slug>.ts`
   file, following `lib/audit.ts`'s precedent of one file per tool's
   real logic) with a pure or `security.ts`-backed `run()`.
2. Push it into `lib/constants.ts` `TOOLS`.
3. `npm run test` — `lib/tools/__tests__/cost-policy.test.ts` fails
   loudly if anything's missing, mis-classified, or points at a
   forbidden dependency.
4. Nothing else. `app/tools/page.tsx`, `app/tools/[slug]/page.tsx`,
   `app/sitemap.ts`, and every `components/tools/*` component already
   read from the registry — no page or component needs to change per
   tool, the same guarantee `docs/architecture.md` already established
   for showcases (ADR-008) and blog posts (ADR-014).

**Out of scope for this phase, per explicit instruction:** no
individual tool was built. `TOOLS` is still `[]`; `/tools` still renders
its honest empty state.

## Accessibility

- **Keyboard**: every interactive element (`ToolInput`'s fields,
  `ToolCTA`'s buttons, a finding's recommendation link, `ToolError`'s
  retry button) is a real `<button>`/`<a>`/form control — no
  click-only `<div>`.
- **Semantic labels**: every field has a real `<label htmlFor>` (via
  `TextField`/`SelectField`, or `ToolInput`'s own textarea wrapper) —
  never a placeholder standing in for a label.
- **Error announcements**: `ToolStatus` (`role="status"`,
  `aria-live="polite"`) for routine transitions; `ToolError`
  (`role="alert"`, `aria-live="assertive"`) for a failure that needs
  immediate attention; `ToolInput`'s validation message is also
  `role="alert"`/`aria-live="polite"`, matching
  `components/audit/AuditInputForm.tsx`'s existing pattern.
- **Visible focus**: every interactive element goes through the
  site-wide `Button`/`Input`/`Select`/`Link` primitives, which already
  carry the one `.focus-ring` rule (`globals.css`) — no new focus style
  was introduced.
- **Contrast**: every color combination in these components reuses
  existing design tokens (`text-ink`/`text-muted`/`Badge` tones) already
  audited for contrast elsewhere in the app — no new color was added.
- **Reduced motion**: `ToolProgress`'s spinner uses the same
  `animate-spin` Tailwind utility already used by
  `AuditProcessing.tsx`, governed by the same global
  `prefers-reduced-motion` rule (`app/globals.css`) as every other
  animation in the app — no tool-specific motion was added.

## Security and caching

Summarized here; full detail in [`docs/tool-security.md`](tool-security.md)
and [`docs/tools-cost-policy.md`](tools-cost-policy.md) §E/§F/§H.

- Every tool is rate-limited (`ToolSecurityPolicy.rateLimitPerIp`,
  enforced the same way `lib/rate-limit.ts` already protects lead
  forms).
- A tool that fetches a visitor-supplied URL must use
  `lib/tools/security.ts` `safeFetch()` — full SSRF protection, one
  fetch per call, no recursive crawling (`MAX_ANALYSIS_DEPTH = 1`).
- Caching is opt-in per tool (`lib/tools/cache.ts`), file-backed, with
  an explicit, named TTL — never indefinite.
