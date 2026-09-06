# Forge Free Tools — Zero-Cost Architecture & Engineering Rules

> This document is the standing policy for `/tools` and any future
> interactive, self-serve analysis tool on the Forge marketing site. It
> governs what a tool is allowed to depend on, how it must behave under
> load or abuse, and how its cost shape must be declared before it ships.
>
> **Business constraint, stated plainly:** Forge does not currently want
> to spend money on third-party APIs, SaaS tools, AI APIs, SEO data
> providers, databases, paid infrastructure, or recurring software
> subscriptions. Every tool built under `/tools` must respect that until
> a human explicitly changes it (see §J).
>
> Companion documents: [`docs/tool-cost-matrix.md`](tool-cost-matrix.md)
> (the per-tool ledger this policy produces), `lib/tools/types.ts` (the
> type contract), `lib/tools/cost-policy.ts` (the automated enforcement),
> and `lib/tools/__tests__/cost-policy.test.ts` (the tests that run it).
> `docs/architecture.md` covers the rest of the site's architecture;
> this document is scoped to the tools platform specifically.

This phase establishes the architecture and rules only. **No individual
tool is built in this phase.** `lib/constants.ts` `TOOLS` remains `[]`;
`/tools` still renders its honest "nothing is live yet" state.

---

## A. Zero-cost principles

1. **A tool must work with $0 in ongoing operating cost.** Not "cheap" —
   zero. If a capability genuinely requires a paid dependency to work
   correctly, the honest answer is `UNAVAILABLE` or `future-paid` (§J),
   never a workaround that quietly starts a metered bill.
2. **Prefer computation over lookup.** Most of what makes Forge's tools
   useful is deterministic analysis of what the visitor already told us
   or what's already public — not a live database query against a paid
   index. The Forge Free Audit (`lib/audit.ts`, ADR-009) is the existing
   proof this pattern works: a 9-question self-report, scored by a pure
   function, with a real, useful, honest result and zero external calls.
3. **A free tier is not a blank check.** An "external-free-api" data
   source is approved only within its provider's documented, published
   free-tier limits, monitored the same way rate limits are (§E). If a
   provider's free tier requires a credit card on file, it is not free
   for this policy's purposes — treat it as `PAID_NOT_ALLOWED` (§C).
4. **Never fabricate what a zero-cost source can't provide.** If a tool
   can't honestly source a metric (a real backlink count, a real search
   ranking, a real competitor ad spend), the tool must say so, plainly,
   rather than approximate, guess, or simulate it as if real. This is
   the same standing rule `docs/forge-business-rules.md` §18 sets for
   marketing claims generally — it applies with equal force to tool
   output.
5. **Degrade honestly, never silently.** A missing data source, a rate
   limit hit, or an unavailable capability must render a visible,
   truthful state (an empty section, a "not available" message) — never
   a placeholder that looks like real data. Same convention this
   codebase already follows for pricing, capacity, and contact info
   (`docs/architecture.md`).
6. **Every cost-bearing decision is declared in code, not assumed in a
   developer's head.** `ToolDefinition` (`lib/tools/types.ts`) makes a
   tool's cost shape a typed, reviewable fact. If it isn't declared, it
   isn't shipped — `lib/tools/cost-policy.ts` `validateToolDefinition()`
   enforces this on every test run (§F/tests below).

---

## B. Approved dependency categories

A tool's data source or dependency must fall into one of these
categories. This list is also the single source of truth in code:
`lib/tools/cost-policy.ts` `APPROVED_DEPENDENCY_CATEGORIES`.

1. **Our own TypeScript/JavaScript logic** — deterministic analysis,
   scoring, heuristics, string/URL parsing, pure functions. No network
   call, no vendor. (`lib/audit.ts`'s `computeAuditResult()` is the
   existing template.)
2. **Browser and Web platform APIs** — `fetch`, `Intl`, `Canvas`, form
   validation, `URL`, etc. No vendor, no key, no cost.
3. **Node.js/Next.js server capabilities already in this stack** — Route
   Handlers, Server Actions, the Node `fs` module (as `lib/file-store.ts`
   already uses, ADR-013). No new infrastructure.
4. **Legitimate free-tier or no-key public APIs**, used strictly within
   their documented, published limits — e.g. a government open-data
   endpoint, a standards body's public lookup, a provider's genuinely
   free (no card required) tier. Each one used must be named explicitly
   in `ToolDataSource.officialDocsUrl` and re-verified against current
   official documentation before shipping (§I).
5. **Customer-authorized integrations** — the customer supplies their
   own account, API key, or OAuth grant, used only for that customer's
   own data, only with their explicit, informed consent, and only for
   the duration/purpose they agreed to. Forge never pays for or shares
   this credential.
6. **Static/MDX content** shipped in this repository (`content/`), same
   pipeline as the blog and showcases (`lib/content.ts`).
7. **Caching** — in-process memory or file-backed (`lib/file-store.ts`
   pattern), never a paid caching/CDN product beyond what the deployment
   platform already provides for free (e.g. Vercel's default CDN caching
   of static assets, already in use, not something this policy adds).
8. **Open-source npm packages** whose functionality actually used has no
   paid-tier requirement. Adding one is still a real decision — see §D
   for how a new dependency gets checked before it's added.

---

## C. Forbidden paid dependencies

**Do not add any paid service. Do not add an API key merely because an
API key exists.** Explicitly forbidden, named directly per the business
constraint:

- OpenAI, Anthropic (any LLM/AI API — including using Claude/GPT/Gemini
  server-side to generate a tool's output)
- Ahrefs, Semrush, DataForSEO, SerpApi, BrightLocal, Moz — or any other
  paid SEO/SERP/local-rank data provider
- Any provider requiring a credit card on file to obtain or keep a
  working API key, even if a "free tier" is advertised
- Any database-as-a-service, hosting add-on, or infrastructure product
  with a recurring bill (this repository has no database at all today —
  see `docs/architecture.md` "Why no CMS" — and this policy does not
  introduce one)
- Any provider whose terms would require Forge to enter payment details
  merely to raise a rate limit

**Do not scrape Google Search, Google Maps, Google Business Profile, or
any search-engine results page.** This is a policy/legal-risk
prohibition independent of cost — it stays forbidden even if a free
scraping method exists, because it violates the target's terms of
service and creates account/IP-ban and legal exposure Forge has not
accepted. (This is the same category of risk `docs/forge-business-rules.md`
already treats seriously for the site's own conduct.)

**Automated enforcement, not just a written rule:**
`lib/tools/cost-policy.ts` `FORBIDDEN_PACKAGE_PATTERNS` matches
`package.json` dependency/devDependency names against the named
providers above (plus a small set of adjacent SEO/AI/data vendors with
the identical shape — Majestic, SpyFu, SimilarWeb's paid API, Ubersuggest,
Clearbit, FullContact). `findForbiddenDependencies()` is run on every
`npm run test` (`lib/tools/__tests__/cost-policy.test.ts`) against this
repository's real `package.json`. This list is a safety net, not the
whole policy — it will never name every paid vendor that could exist.
The standing rule is the one above: no paid service, ever, without going
through §J first. If a new dependency is proposed and you are unsure
whether it's "free enough," treat it as forbidden until verified against
its own current pricing page.

---

## D. API key policy

1. **No API key is added speculatively.** A key is added only at the
   moment a specific, already-approved tool capability needs it, tied to
   a named `ToolDataSource` in code.
2. **Every key-requiring data source must declare `apiKeyEnvVar`**
   (`ToolDataSource.apiKeyEnvVar` in `lib/tools/types.ts`) — the exact
   environment variable name, never a hard-coded value, never a
   client-exposed (`NEXT_PUBLIC_*`) secret unless the provider's own key
   is explicitly designed to be public (rare, and must be documented as
   such if so). `lib/tools/cost-policy.ts` `validateToolDefinition()`
   fails any data source that sets `requiresApiKey: true` without a
   matching `apiKeyEnvVar` — the same discipline `lib/crm.ts`'s
   `CRM_WEBHOOK_SECRET` already follows (read by name, never invented,
   never present unless a real deployment sets it).
3. **No key implies no capability, not a crash.** Every code path that
   reads an optional key-gated env var must check for its presence and
   degrade to an honest `UNAVAILABLE`/absent state when it's unset — the
   same graceful-degradation standard `lib/crm.ts` (ADR-010) and
   `app/r/[code]/route.ts` (ADR-019) already established for CRM/referral
   failures.
4. **A key existing in a provider's docs is not authorization to use
   it.** Free-tier signup availability is a prerequisite, not a decision
   — a data source only moves from "candidate" to "approved" in
   `docs/tool-cost-matrix.md` once a human has confirmed it against that
   provider's current terms and the cost stays at `FREE_EXTERNAL_API`.
5. **Customer-authorized keys are the customer's, never Forge's.** A
   `CUSTOMER_AUTHORIZED` data source must not be storable or reusable
   beyond the specific run/consented purpose without a fresh, explicit
   grant — no silently caching a customer's own key for a different
   tool or a later, unrelated run.

---

## E. Rate limiting policy

1. **Every tool that accepts input from an unauthenticated visitor must
   be rate-limited**, the same pattern `lib/rate-limit.ts` already
   implements for lead capture (in-memory, fixed-window, honestly
   documented as single-process — see `docs/crm.md` "Known limitations").
   `ToolSecurityPolicy.rateLimitPerIp` is a required, non-empty field
   (`validateToolDefinition()` fails a tool without one) — it must name
   the actual enforced rule (e.g. "20 requests / 10 min / IP-ish key"),
   not a placeholder.
2. **Rate limits protect two different things and both must be
   considered:** (a) Forge's own compute/hosting usage on a
   pay-as-you-go platform (Vercel), and (b) any external free-tier API's
   own published rate limit, which must never be approached, let alone
   exceeded, by aggregate tool traffic. A tool using an
   `external-free-api` data source must set its own internal limit
   comfortably below that provider's documented ceiling.
3. **A rate-limited visitor gets an honest, specific message** — a
   normal degrade state, not a raw 429 with no explanation — consistent
   with this codebase's existing "an outage is visible, not silent"
   convention (`lib/crm.ts` `GRACEFUL_ERROR`).
4. **If a future deployment needs rate limiting to hold across
   serverless instances** (the same class of problem ADR-013 already
   found and fixed for referral state), that requires a real shared
   store — which itself must clear this same zero-cost policy before
   being added. Do not solve it by silently switching a rate limiter to
   a paid Redis/rate-limiting SaaS product.

---

## F. Caching policy

1. **Cache any tool result that is expensive to (re)compute or that
   depends on a rate-limited external source**, to reduce both compute
   cost and the chance of hitting a free-tier ceiling.
2. **Cache key must be a hash of the normalized input**, never a raw,
   unvalidated user string used directly as a filesystem path or cache
   key (this is also a security requirement — see §H).
3. **Cache storage must itself be zero-cost** — in-process memory for a
   single request lifecycle, or a file-backed store following
   `lib/file-store.ts`'s existing pattern (whole-file JSON, no paid
   database). The same cross-bundle caveat ADR-013 documented for
   `lib/file-store.ts` (a plain in-memory `Map` does not reliably share
   state between a Route Handler and a Server Action in this framework)
   applies to any tool cache too — use the file-backed pattern, not a
   bare module-level `Map`, for anything that must be visible across
   that boundary.
4. **`ToolResult.cached`** (`lib/tools/types.ts`) makes a cache hit
   explicit in the result shape itself — never presented to the visitor
   as indistinguishable from a fresh computation when that distinction
   matters (e.g. for a result whose underlying facts could have changed).
5. **Cache entries expire.** An unbounded cache is itself a soft cost
   (disk growth, stale results presented as current) — every cached tool
   must define and document a retention/expiry window as part of its
   `ToolSecurityPolicy.dataRetention` field.

---

## G. Abuse prevention

Beyond rate limiting (§E), a self-serve public tool needs its own abuse
posture:

1. **Honeypot pattern on any form-shaped tool input**, reusing
   `components/forms/Honeypot.tsx` — the same spam-trap already checked
   in `app/actions.ts` for lead forms.
2. **Input size and shape limits** — cap string lengths, reject
   malformed URLs before they're used anywhere (see §H for SSRF), and
   never accept an unbounded-size payload (file upload, huge JSON body)
   without an explicit, small limit.
3. **No tool may be used to attack a third party.** A tool that fetches
   a visitor-supplied URL (e.g. "check this website") must not become a
   generic server-side request proxy — §H's SSRF mitigations exist
   specifically to prevent a tool being repurposed as one.
4. **No tool stores more than it needs.** `ToolSecurityPolicy.dataRetention`
   must default toward `'none'` unless a specific business reason (a
   lead capture the visitor explicitly opted into, matching
   `lib/crm.ts`'s existing "no dead-end lead record for a non-converting
   visitor" rule) requires otherwise.
5. **Abuse signals get logged without PII**, following
   `lib/crm.ts` `safeLogFields()`'s existing pattern (coarse booleans and
   ids, never the raw input value) — so a rate-limit/abuse pattern is
   debuggable without turning server logs into an unintended PII store.

---

## H. SSRF / security requirements

Any tool that accepts a visitor-supplied URL (a website, a Google
Business Profile link) and fetches it server-side is a real SSRF
surface, independent of cost. `ToolSecurityPolicy.acceptsUserSuppliedUrl`
and `ssrfMitigation` exist specifically for this — a tool that sets the
former to `true` must document real mitigations, or
`validateToolDefinition()` fails it. Required mitigations for any such
tool:

1. **Reject non-`http(s)` schemes outright** — no `file://`, `ftp://`,
   `data:`, `gopher://`, etc.
2. **Resolve the hostname and reject private/internal IP ranges**
   (loopback `127.0.0.0/8`, link-local `169.254.0.0/16` — including the
   cloud metadata endpoint `169.254.169.254`, private ranges
   `10.0.0.0/8`/`172.16.0.0/12`/`192.168.0.0/16`, and IPv6 equivalents)
   before issuing the request, not just by string-matching the input —
   a DNS response can point a "safe-looking" hostname at an internal IP.
3. **No following of redirects into a disallowed range** — validate the
   redirect target the same way as the original URL, or disable
   automatic redirect-following entirely and re-validate manually.
4. **A hard timeout and response-size cap** on any outbound fetch, the
   same discipline `lib/crm.ts`'s webhook provider already applies
   (`WEBHOOK_TIMEOUT_MS`, `AbortController`) — an SSRF-adjacent request
   must not be able to hang a serverless function or pull down an
   unbounded response.
5. **Never reflect the raw fetched response body back to the client
   unsanitized** — a tool analyzing a visitor's website must treat that
   site's HTML as untrusted content, not render it directly (XSS risk on
   top of SSRF risk).
6. **Standard input validation everywhere else too** — every
   `ToolDefinition.securityPolicy.inputValidation` field must be
   non-empty and describe what's actually validated, matching
   `lib/validation.ts`'s existing `isValidEmail`/`normalizeUrl` pattern
   rather than leaving validation as an implementation detail no one
   checks.
7. **CSP stays scoped.** Adding a tool with a legitimate
   `external-free-api` data source may require adding that provider's
   domain to `next.config.mjs`'s `connect-src` — do this narrowly, one
   named domain at a time, the same way the CSP is already scoped to
   `'self'` only until a real vendor is configured (`next.config.mjs`
   comment, unchanged in this phase).

---

## I. Provider replacement strategy

1. **Every external data source is behind an explicit abstraction**,
   never called directly from a component or page — matching the
   existing `CrmAdapter`/`AnalyticsProvider` pattern (`lib/crm.ts`,
   `lib/analytics.ts`). A tool's server logic calls a named function; the
   function's internals decide which provider (if any) actually answers.
2. **A provider can be swapped or removed without changing any call
   site** — the same property ADR-010 established for the CRM adapter.
   If a free-tier provider changes its terms, gets deprecated, or starts
   requiring payment, the fix is confined to that one data-source
   implementation and its `ToolDataSource` declaration.
3. **A capability degrades to `UNAVAILABLE`, never silently to fabricated
   data, when its provider stops being free.** The moment a provider's
   free tier changes in a way that would make continued use violate this
   policy, the corresponding `ToolDataSource.costClassification` is
   updated to `PAID_NOT_ALLOWED` (which `validateToolDefinition()` will
   then reject) or the tool's `status` moves to `'unavailable'` — not
   left running against a now-paid dependency.
4. **The UI must never imply that a `future-paid` tool is currently
   available.** `ToolCard` (`components/tools/ToolCard.tsx`) renders a
   `future-paid`-status tool as a disabled card with an explicit
   "requires a paid provider decision" label, never a working link.
   `app/tools/[slug]/page.tsx` only pre-renders and resolves a real page
   for a tool whose `status` is `'available'` — a `planned`,
   `unavailable`, or `future-paid` tool has no live route to 404-bypass,
   and does not appear in `/sitemap.xml`.
5. **Re-verify official documentation before relying on any external
   free tier**, not just at build time — a provider's pricing/limits can
   change. `docs/tool-cost-matrix.md`'s "Recommended status" column is
   the place this gets re-checked and dated whenever a tool using an
   `external-free-api` source is touched.

---

## J. Conditions under which a paid service could be introduced later

This policy is **current business direction, not a permanent
architectural ceiling.** A paid dependency could be introduced later,
but only when **all** of the following hold:

1. **Explicit business-owner authorization**, the same way the
   commercial ladder itself was only finalized once the business owner
   gave it directly (ADR-011) — never inferred from "this would make the
   tool better" or "the free version is good enough to justify upgrading."
2. **A specific, named tool and a specific, named provider** — not a
   general "let's allow paid APIs now" policy change. Each paid
   introduction is its own decision, logged as its own ADR in
   `docs/decisions.md`, citing this section.
3. **A documented cost ceiling** (a monthly budget cap, a per-request
   cost estimate, expected volume) reviewed and accepted by the business
   owner before the key is ever added to an environment — not an
   open-ended "pay whatever it costs" commitment.
4. **The corresponding `ToolDataSource.costClassification` is updated
   honestly** — this is the one legitimate way a data source can be
   `PAID_NOT_ALLOWED`'s sibling in spirit; in practice this means the
   automated forbidden-dependency check (§C) and `validateToolDefinition()`
   must be updated in the same change that adds the dependency, not
   bypassed. A paid dependency introduced this way is never silently
   exempted from review — it's the one case where the checks change on
   purpose, with a paper trail.
5. **A real fallback still exists**, or the tool's status is honestly
   set to reflect the new dependency (e.g. `customer-authorized` if the
   paid cost shifts to the customer's own account rather than Forge's).
   A tool must not go from "zero-cost and working" to "costs money and
   silently keeps working" — the shift itself must be visible in the
   codebase, this document, and `docs/tool-cost-matrix.md`.

Until all five hold, the default for any tool idea that needs a paid
provider to work properly is `future-paid` — documented, honest, and not
built, not `PAID_NOT_ALLOWED` snuck in under an approved-looking label.
