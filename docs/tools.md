# Forge Free Tools — Providers Reference

> Companion to [`docs/tool-architecture.md`](tool-architecture.md) (the
> reusable tools engine), [`docs/tool-security.md`](tool-security.md)
> (the SSRF/fetch contract), and [`docs/tools-cost-policy.md`](tools-cost-policy.md)
> (the zero-cost policy every provider below must satisfy). This
> document is the one place a *provider* — anything outside Forge's own
> code that a tool talks to — gets documented in full: what it is, what
> it costs, its quota, its limitations, and exactly how a tool degrades
> when it's unavailable.
>
> As of this document, there is exactly one external provider in this
> codebase: **PageSpeedProvider** (Google PageSpeed Insights API v5).
> Every other tool (`lib/website-analyzer/`) is `FREE_INTERNAL` — no
> external provider at all.

---

## PageSpeedProvider

**Interface:** `lib/pagespeed/provider.ts` `PageSpeedProvider`
**Real implementation:** `lib/pagespeed/google-provider.ts` `googlePageSpeedProvider`
**Used by:** the Forge PageSpeed Test (`/tools/page-speed-test`,
`lib/pagespeed/tool.ts`) — the only tool that uses it.

### What it is

Google's [PageSpeed Insights API v5](https://developers.google.com/speed/docs/insights/v5/get-started)
(`runPagespeed`) — a single HTTP call that returns a real Lighthouse
lab run (performance/accessibility/best-practices scores, Core Web
Vitals, opportunities, diagnostics) plus, when available, real-user
Chrome UX Report (CrUX) field data for the URL and/or its origin.

### Verified directly against current official docs (2026-09-07)

Every claim below was checked against Google's own current
documentation on the date this feature was built, not assumed from
memory or a third-party source — the same standard `docs/tool-security.md`
already holds this codebase to for security claims.

| Question | Verified answer | Source |
|---|---|---|
| Is an API key required? | **No — optional.** "The API can be used with or without an API key, although a key is recommended for frequent, automated queries." | [`.../v5/get-started`](https://developers.google.com/speed/docs/insights/v5/get-started) ("Last updated 2025-08-28") |
| Does using it require billing? | **No.** Google does not charge for calls to this specific API — unlike many other Google Cloud APIs, PageSpeed Insights has no paid tier at all. | Same page; no billing/pricing section exists for this API |
| Quota (queries/day, queries/100s)? | **Not publicly specified.** No number appears on either current docs page checked. Google Cloud Console assigns a per-project default only after a key is created — not published inline in the docs. | `.../v5/get-started`, `.../v5/about` — both checked, neither states a figure |
| Request restrictions (rate limit, referrer/origin restriction)? | **None documented.** | Same two pages |
| Available `category` values | Exactly `performance`, `accessibility`, `best-practices`, `seo` | [`.../v5/reference/pagespeedapi/runpagespeed`](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed) |
| Current Core Web Vitals | **LCP, CLS, INP** — Interaction to Next Paint (INP) "officially replaced First Input Delay (FID) [as a Core Web Vital] on March 12" 2024. Forge never reports FID. | [`web.dev/blog/inp-cwv-march-12`](https://web.dev/blog/inp-cwv-march-12) |
| LCP thresholds | Good ≤2.5s, poor >4.0s | [`web.dev/articles/lcp`](https://web.dev/articles/lcp) |
| INP thresholds | Good ≤200ms, poor >500ms | [`web.dev/articles/inp`](https://web.dev/articles/inp) |
| TTFB thresholds | Good ≤0.8s, poor >1.8s | [`web.dev/articles/ttfb`](https://web.dev/articles/ttfb) |
| CLS / FCP thresholds | Good ≤0.1 / ≤1.8s, poor >0.25 / >3.0s | Google's stable, long-published thresholds for both metrics |
| Lab vs. field data | Top-level response fields are `lighthouseResult` (a single simulated Lighthouse run — **lab**), `loadingExperience` (page-level real-user CrUX data — **field**), `originLoadingExperience` (origin-level real-user CrUX data — **field**, coarser scope) | Confirmed field-name list directly from `.../v5/reference/pagespeedapi/runpagespeed` |

All five thresholds above are re-declared, with these exact citations,
in `lib/pagespeed/thresholds.ts` — that file is the single source of
truth in code; this table is the paper trail for where the numbers
came from.

### Cost classification

`FREE_EXTERNAL_API` (`lib/tools/types.ts` `ToolCostClassification`) —
category 4 of `docs/tools-cost-policy.md` §B: "a legitimate free-tier/
no-key public API, used within its documented, published limits." No
quota number is published to check against, so Forge enforces its own,
independent, conservative limit instead (see "Rate limiting" below) —
never assumes Google's real limit is generous just because it isn't
stated.

### API key policy

**Entirely key-gated, by design — not just by default.**
`googlePageSpeedProvider.isConfigured()` returns `false` (and
`analyze()` makes zero network calls) unless `PSI_API_KEY` is set in
the environment. No `.env` exists anywhere in this repository (the
same standing fact already true of every other optional integration
here — `docs/crm.md`), so **on Forge's actual deployment, as shipped,
this provider never calls Google at all.**

Why key-gated rather than falling back to the unauthenticated form of
the endpoint: Google's own docs discourage the unkeyed form for
"frequent, automated queries" — a public-facing Forge tool is exactly
that. Attempting unkeyed calls risks Forge's server IP being
rate-limited or blocked by Google for behavior Google's docs already
say not to do. No key set is treated as `'not-configured'` —
`UNAVAILABLE`, honestly, never a degraded automatic attempt.

**"Do not add billing," honored structurally:** this codebase never
creates a Google Cloud project, never enables an API, and never touches
billing on anyone's behalf. If a human wants live PageSpeed data, they
set `PSI_API_KEY` themselves, outside this repo, after doing whatever
Google Cloud Console requires at the time — a decision and a process
this codebase deliberately has no part in and cannot verify in advance
(Google's own console flow, which can change).

### Rate limiting (Forge's own, independent of Google's unstated one)

`lib/pagespeed/actions.ts`: **5 requests / 10 minutes / IP-ish key**,
server-only, in-memory (`lib/rate-limit.ts`) — tighter than the other
12 tools' 10/10min, because a real Lighthouse run is Google's own slow
(10-20s+), quota-metered operation. This limit exists specifically
*because* Google's real limit isn't published — Forge doesn't wait to
find out the hard way.

### Caching

`lib/pagespeed/cache.ts` — file-backed (`lib/file-store.ts`), keyed by
a hash of `(strategy, normalized URL)` only — no visitor identity,
session, or IP anywhere in the key or the cached value. **12-hour TTL**
(longer than the general website-analyzer cache's 6h), because (a) a
real Lighthouse run is expensive/quota-metered and worth reusing
aggressively, and (b) CrUX field data is itself a 28-day rolling
average — it doesn't meaningfully change hour to hour. A **transient**
failure (timeout, network error, any 5xx) is never cached — only a
complete success or a stable outcome (`not-configured`, an
input-validation failure) is worth serving stale for 12 hours; a
transient hiccup should let the very next visitor get a real retry.

### Limitations — stated plainly

- **No quota number to plan against.** See the table above — Forge's
  own 5/10min limit is a defensive choice, not a figure derived from
  Google's real ceiling, which isn't published.
- **INP has no lab equivalent.** A single simulated Lighthouse run has
  no real user interaction for Lighthouse to derive INP from — the lab
  half of a PageSpeed result never includes INP; only field data can
  supply it, and only when Google has enough real-user traffic to
  report on. `lib/pagespeed/normalizer.ts`'s own comment documents this
  exactly where it matters (`extractLabCoreWebVitals`).
- **Field data is frequently absent for lower-traffic sites.** This is
  normal, expected CrUX behavior, not a bug — Google only publishes
  real-user data once a site clears its own traffic threshold. When
  absent, Forge shows lab data instead (clearly labeled `lab`, not
  `field`) or an honest `unavailable`, never a fabricated number.
- **Field data can be origin-scoped, not page-scoped.** When Google has
  no page-specific sample, `loadingExperience` is absent but
  `originLoadingExperience` (the whole site's aggregate) may still
  exist — Forge falls back to it, but labels it `scope: 'origin'`
  explicitly in both the data and the UI copy ("based on your whole
  site's real-user data"), never silently presenting site-wide data as
  if it described one page.
- **A real Lighthouse run is slow.** 10-25 seconds is normal, not a
  sign of a bug — `lib/pagespeed/google-provider.ts`'s own timeout is
  set to 25s specifically to avoid cutting off a legitimately slow (not
  failed) Google response.

### Fallback behavior

When `PageSpeedAnalysis.status === 'unavailable'` (no key, invalid URL,
quota exceeded, timeout, network error, or an unexpected Google
response) — for **any** reason — `lib/pagespeed/findings.ts`
`buildUnavailableFindings()` produces one honest, explicit `Finding`
per score/metric slot (8 total: 3 category scores + 5 Core Web Vitals),
each tagged `confidence: 'unavailable'`, `dataOrigin: 'unavailable'`,
and a plain-language explanation of *why* — never zero findings, never
a fabricated number standing in for a real one. Meanwhile, the internal
Website Diagnostic Engine's SEO/technical checks (title, meta,
viewport, schema, headings, HTTPS, images, mobile signals —
`lib/website-analyzer/`) run and render completely independently of
PageSpeed's availability, so **the tool remains fully useful with zero
Google involvement at all** — verified live, not just in tests: with no
`PSI_API_KEY` set (this repository's actual state), `/tools/page-speed-test`
against a real URL returns a complete, honest report with every
PageSpeed-sourced finding marked `unavailable` and every internal-engine
finding fully populated.

### Provider replaceability

`lib/pagespeed/actions.ts` has exactly one line naming a concrete
provider (`const PROVIDER: PageSpeedProvider = googlePageSpeedProvider`)
— every other line in this feature talks to the `PageSpeedProvider`
interface. Swapping to a different provider (a different PSI-compatible
service, a self-hosted Lighthouse CI instance, or simply turning this
feature off entirely) means writing one new file implementing
`PageSpeedProvider` and changing that one line — the same
replaceability property `lib/crm.ts`'s `CrmAdapter` and
`lib/analytics.ts`'s `AnalyticsProvider` already established for this
codebase's other swappable integrations.

---

## Testing — mocked provider only, per standing policy

`lib/pagespeed/__tests__/` (50 tests, all zero-network):
`google-provider.test.ts` mocks `global.fetch` and
`lib/tools/security.ts`'s `validateUrlForFetch` — no real call to
Google is ever made in this suite, including the success-path test,
which asserts against a hand-crafted mock response.
`normalizer.test.ts`/`findings.test.ts`/`thresholds.test.ts`/`cache.test.ts`
are pure-function tests against hand-built fixtures. Re-run
`npm run test` after touching anything in `lib/pagespeed/` and treat a
failure as a real regression.
