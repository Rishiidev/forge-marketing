# Forge Free Tools — Cost Matrix

> Companion to [`docs/tools-cost-policy.md`](tools-cost-policy.md) (the
> policy) and `lib/tools/types.ts`/`lib/tools/cost-policy.ts` (the typed
> enforcement). Every row below is either (a) a real, shipped feature in
> this repository, verified by reading its source, or (b) an explicitly
> labeled **candidate** grounded in something that already exists in this
> repository (legacy code, an existing pattern) — never a speculative
> tool idea invented for this document. No tool is built in this phase;
> this matrix records what's true today and what a first `/tools` entry
> would need to satisfy before shipping.

**Current state of `/tools` itself, verified directly:** `lib/constants.ts`
`TOOLS` is `[]`. `/tools` renders an honest "nothing is live yet" state
(`components/tools/ToolGrid.tsx`). `/tools/[slug]` only pre-renders and
resolves a page for an entry whose `status` is `'available'`
(post-policy change, this phase) — with `TOOLS` empty, no such page
exists, and `/sitemap.xml` correctly lists no `/tools/*` URL. **Zero
tools are live under `/tools` as of this document.**

---

## Columns, defined

| Column | Meaning |
|---|---|
| Tool | Name / route |
| Data required | What input or fact the tool needs to produce a result |
| Data source | Where that comes from (self-report, internal logic, a named external source) |
| Cost | `lib/tools/types.ts` `ToolCostClassification` — `FREE_INTERNAL` / `FREE_EXTERNAL_API` / `CUSTOMER_AUTHORIZED` / `PAID_NOT_ALLOWED` / `UNAVAILABLE` |
| API required | Whether any network call to a third party is made |
| API key required | Whether that call needs a credential |
| Customer authorization required | Whether the data belongs to the customer and needs their explicit consent/credential |
| Rate-limit risk | How exposed the tool is to abuse/cost from repeated use |
| Legal/policy risk | Scraping, ToS, or data-handling risk independent of cost |
| Server workload | Roughly how expensive one run is to compute/serve |
| Recommended status | `ToolStatus` this tool should ship (or currently has) as |

---

## Row 1 — Forge Free Audit (`/audit`)

Not registered in `lib/constants.ts` `TOOLS` (it predates and sits
outside the `/tools` registry — it's a dedicated route, ADR-009) but it
is the one real, shipped, self-serve analysis tool in this codebase and
the working template for how a zero-cost `/tools` entry should be built.
Verified directly from `lib/audit.ts` and `docs/decisions.md` ADR-009.

| Column | Value |
|---|---|
| Tool | Forge Free Audit — `/audit` |
| Data required | Answers to a 9-question self-report questionnaire (business info, website presence, contactability, reviews, service clarity, mobile experience, online credibility, local discoverability, conversion friction) |
| Data source | The visitor's own answers only — nothing looked up externally. No Google Business Profile API integration exists (no credentials, no `.env`, confirmed) |
| Cost | `FREE_INTERNAL` |
| API required | No |
| API key required | No |
| Customer authorization required | No — the visitor supplies only self-reported answers, optionally their own email/WhatsApp at the very end, voluntarily |
| Rate-limit risk | Low for the audit computation itself (pure client-side function, `computeAuditResult()`); the optional lead-capture step at the end goes through `app/actions.ts`'s existing rate-limited Server Action (`lib/rate-limit.ts`) |
| Legal/policy risk | None identified — no scraping, no third-party data, self-report only |
| Server workload | Near-zero — `computeAuditResult()` runs client-side; only the optional final lead capture touches the server |
| Recommended status | `available` (already shipped) |

---

## Row 2 — candidate: Website/GBP quote calculator

**Not built. Not in `TOOLS`. Grounded in a real, existing legacy
artifact**, not invented: `legacy/bespoke-quote.html` — a six-question,
client-side price calculator (verified: `legacy/bespoke-quote.html`,
`docs/forge-business-rules.md` §8 references it) that was never migrated
into the Next.js rebuild (`docs/architecture.md` "Out of scope" doesn't
name it explicitly, but no `app/tools/*` or `lib/` equivalent exists —
confirmed by search). Listed here as the most obviously zero-cost
candidate for a first real `/tools` entry, precisely because its legacy
version already proves the pattern needs no external data.

| Column | Value |
|---|---|
| Tool | Website quote/scope calculator (candidate — not built) |
| Data required | The visitor's own selections from a fixed set of options (site type, page count, add-ons) — no external lookup |
| Data source | Internal pricing logic only, driven by `lib/constants.ts` `WEBSITE_TIERS`/add-on pricing (once/if defined there) — same "single source of truth" pattern already used for the pricing pages |
| Cost | `FREE_INTERNAL` |
| API required | No |
| API key required | No |
| Customer authorization required | No |
| Rate-limit risk | Low — pure client-side computation once shipped, same shape as the audit tool |
| Legal/policy risk | None — no scraping, no external data. Must avoid the legacy version's own historical pricing-conflict problem (`docs/forge-business-rules.md` §8, HD#2 — now resolved by ADR-011) by reading prices from `lib/constants.ts` only, never re-hard-coding them |
| Server workload | Near-zero if built client-side, matching the audit tool's pattern |
| Recommended status | `planned` if greenlit for a future phase — this document does not authorize building it; see `docs/tools-cost-policy.md` intro ("no individual tool is built in this phase") |

---

## What is deliberately not in this matrix

No row exists for a GBP-live-lookup tool, a real backlink/SEO-metrics
tool, a competitor-ranking tool, or any tool that would require a paid
SEO data provider (Ahrefs/Semrush/DataForSEO/SerpApi/BrightLocal/Moz) or
scraping Google Search/Maps/GBP results — all explicitly forbidden by
`docs/tools-cost-policy.md` §C. If a future session is asked to build
one of these, the correct action is to classify it `PAID_NOT_ALLOWED`/
`future-paid` and route the decision through §J, not to invent a
scraping or unofficial-API workaround to make it appear zero-cost when
it structurally isn't.

## Maintaining this document

Add a row only for a tool that is either shipped (verified against its
actual source) or a genuinely grounded candidate (tied to something real
already in this repository, as Row 2 is). Every `Cost`/`API required`/
`API key required` value must match what `lib/constants.ts` `TOOLS`
(once populated) and `lib/tools/__tests__/cost-policy.test.ts` actually
enforce — this document describes the code, it does not substitute for
the typed `ToolDefinition` that is the real source of truth.
