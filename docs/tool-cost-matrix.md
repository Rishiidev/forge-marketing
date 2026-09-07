# Forge Free Tools — Cost Matrix

> Companion to [`docs/tools-cost-policy.md`](tools-cost-policy.md) (the
> policy), [`docs/tools.md`](tools.md) (the full provider-by-provider
> reference — read that for `PageSpeedProvider`'s complete quota/cost/
> limitations/fallback documentation; this table only summarizes it),
> and `lib/tools/types.ts`/`lib/tools/cost-policy.ts` (the typed
> enforcement). Every row below is a real, shipped feature in this
> repository, verified by reading its source — this document describes
> the code, it does not substitute for the typed `ToolDefinition` that
> is the real source of truth (`lib/tools/__tests__/cost-policy.test.ts`
> validates every one of them on every `npm run test`).

**Current state of `/tools`, verified directly (2026-09-07):**
`lib/constants.ts` `TOOLS` has **13 entries** — 12 from the Forge
Website Diagnostic Engine (`lib/website-analyzer/tools.ts`,
`docs/tool-architecture.md`) plus the Forge PageSpeed Test
(`lib/pagespeed/tool.ts`, `docs/tools.md`). All 13 are `status: 'available'`.
This corrects the previous version of this document, which described
`TOOLS` as still `[]` — that was the state immediately after the
zero-cost policy phase, before either tool suite was built.

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
is a real, shipped, self-serve analysis tool and the original working
template the whole `/tools` platform was built to match. Verified
directly from `lib/audit.ts` and `docs/decisions.md` ADR-009.

| Column | Value |
|---|---|
| Tool | Forge Free Audit — `/audit` |
| Data required | Answers to a 9-question self-report questionnaire |
| Data source | The visitor's own answers only — nothing looked up externally |
| Cost | `FREE_INTERNAL` |
| API required | No |
| API key required | No |
| Customer authorization required | No |
| Rate-limit risk | Low — pure client-side computation; the optional lead-capture step is rate-limited (`lib/rate-limit.ts`) |
| Legal/policy risk | None — no scraping, self-report only |
| Server workload | Near-zero |
| Recommended status | `available` (shipped) |

---

## Rows 2-13 — the Forge Website Diagnostic Engine (`/tools/*`, 12 tools)

**All 12 share one cost/security profile**, generated from the same
template (`lib/website-analyzer/tools.ts` `makeAnalyzerTool()`,
`SHARED_DATA_SOURCE`/`SHARED_SECURITY_POLICY`) — listed once here
rather than as 12 near-identical rows, per this document's own
"describes the code" principle: the real, enforced source of truth is
that shared template, not a hand-maintained table that could drift from
it. `website-seo-audit`, `website-health-check`, `mobile-website-check`,
`schema-checker`, `meta-checker`, `open-graph-checker`,
`robots-txt-checker`, `sitemap-checker`, `link-checker`,
`image-seo-checker`, `security-headers-checker`, `local-seo-checker`.

| Column | Value |
|---|---|
| Data required | One URL — the visitor's own homepage |
| Data source | The submitted URL's own HTTP response + HTML, fetched directly by Forge's server (`lib/website-analyzer/fetcher.ts`); plus `/robots.txt` and `/sitemap.xml` at the same origin. No third-party API of any kind. |
| Cost | `FREE_INTERNAL` |
| API required | No — this is Forge's own logic against a public URL the visitor supplied, using the standard `fetch` API (`docs/tools-cost-policy.md` §B category 2), not a third-party vendor API |
| API key required | No |
| Customer authorization required | No |
| Rate-limit risk | Bounded — 10 requests / 10 min / IP-ish key (`lib/website-analyzer/actions.ts`), plus a hard cap on internal link reachability checks (`MAX_LINKS_TO_CHECK = 5`) so one run can never trigger unbounded outbound requests |
| Legal/policy risk | None — no scraping of Google Search/Maps/GBP or any third party; fetches only the URL the visitor themselves submitted, under a full SSRF policy (`docs/tool-security.md`) |
| Server workload | One homepage fetch + parse per run (up to ~3MB HTML), plus two small auxiliary fetches (robots.txt/sitemap.xml) and up to 5 lightweight HEAD requests for link-checking. Cached 6h per URL (`lib/website-analyzer/analyzer.ts`) — a second tool run against the same URL reuses the cached analysis, no re-fetch. |
| Recommended status | `available` (shipped, all 12) |

---

## Row 14 — Forge PageSpeed Test (`/tools/page-speed-test`)

The one tool in this platform with a real external provider. Full
documentation: [`docs/tools.md`](tools.md) "PageSpeedProvider" — this
row summarizes it.

| Column | Value |
|---|---|
| Tool | Forge PageSpeed Test — `/tools/page-speed-test` |
| Data required | One URL — the visitor's own homepage |
| Data source | Google PageSpeed Insights API v5 (`lighthouseResult` lab data + `loadingExperience`/`originLoadingExperience` field data), **when configured** — plus the same internal Website Diagnostic Engine categories every other tool above uses (title/meta/viewport/schema/headings/HTTPS/images/mobile), always, regardless of Google's availability |
| Cost | `FREE_EXTERNAL_API` for the Google half (`lib/pagespeed/tool.ts`) — Google does not charge for this API, no paid tier exists for it, confirmed against current official docs (`docs/tools.md`); `FREE_INTERNAL` for the Website Diagnostic Engine half |
| API required | Yes, for the PageSpeed half — `googleapis.com/pagespeedonline/v5/runPagespeed`, only when `PSI_API_KEY` is set |
| API key required | Yes, for the PageSpeed half (`PSI_API_KEY`) — **not set anywhere in this repository/deployment**, so this half is `unavailable` by default; the tool remains fully functional on the internal-engine half alone, verified live (`docs/tools.md` "Fallback behavior") |
| Customer authorization required | No |
| Rate-limit risk | Tighter than the other 12 tools — 5 requests / 10 min / IP-ish key (`lib/pagespeed/actions.ts`), because a real Lighthouse run is Google's own slow, quota-metered operation and no quota number is published to plan against (`docs/tools.md`) |
| Legal/policy risk | None — Google's own public API, used within the categories it documents (`performance`/`accessibility`/`best-practices`; deliberately not `seo`, which the internal engine already covers) |
| Server workload | One Google API call (10-25s, Google's own compute, not Forge's) + the same internal-engine homepage fetch every other tool does. Cached 12h per (URL, strategy) — longer than the other tools', since a real Lighthouse run is expensive to repeat and CrUX field data is a 28-day rolling average that doesn't change hour to hour. |
| Recommended status | `available` (shipped) — functions correctly with or without `PSI_API_KEY` set |

---

## Candidate — Website/GBP quote calculator (not built)

**Not built. Not in `TOOLS`.** Grounded in a real, existing legacy
artifact: `legacy/bespoke-quote.html` — a six-question, client-side
price calculator, never migrated into the Next.js rebuild. Still the
most obviously zero-cost candidate for a future addition, precisely
because its legacy version already proves the pattern needs no external
data (`Cost: FREE_INTERNAL`, no API, no key, no customer authorization
— same shape as the Forge Free Audit).

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
already in this repository). Every `Cost`/`API required`/`API key
required` value must match what `lib/constants.ts` `TOOLS` and
`lib/tools/__tests__/cost-policy.test.ts` actually enforce.
