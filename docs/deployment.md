# Forge Marketing — Deployment

This is the deployment reference for the rebuilt Forge marketing site.
Read this before deploying anywhere. It documents how the architecture
was actually determined (not assumed), why Vercel was chosen, what was
verified before and after the first deployment, and the checklist for
promoting a preview to production.

---

## 1. Architecture determination

Done by reading `docs/architecture.md` and `docs/decisions.md`, then
confirming directly against the real build output and source tree
(`npm run build`, `find app -name "route.ts"`, `grep -rn "'use server'"`)
rather than trusting the docs alone.

**Static, dynamic, or hybrid? Hybrid.** From the last `npm run build`:

| Type | Routes |
|---|---|
| Static (`○`) | `/`, `/audit`, `/design-system`, `/maintenance`, `/showcases`, `/tools`, `/websites`, `/websites/5000`, `/websites/15000`, `/websites/25000`, `/robots.txt`, `/sitemap.xml` |
| SSG via `generateStaticParams` (`●`) | `/blog/[slug]` (3 real posts), `/showcases/[slug]` (3 real entries), `/tools/[slug]` (empty registry — no params generated) |
| Dynamic (`ƒ`) | `/blog` (reads `searchParams` for the category filter), `/r/[code]` (Route Handler, sets a cookie, always redirects) |

The overwhelming majority of the site is pre-rendered at build time.
Nothing requires a persistent server process, a database connection at
request time, or an edge runtime — a static-hosting-plus-serverless-
functions platform is the correct shape, not a long-running Node server.

**Server functions, Route Handlers, APIs, Server Actions?**

- **Server Actions**: `app/actions.ts` exports two — `submitLeadAction`
  (behind every generic lead form) and `submitAuditLeadAction` (behind
  the Forge Free Audit's optional follow-up capture). Both run
  server-side only, both are rate-limited and honeypot-checked.
- **Route Handler**: exactly one, `app/r/[code]/route.ts` — resolves a
  referral code, sets a 30-day attribution cookie, redirects to `/audit`.
- **Traditional REST API routes**: none. `find app -name "route.ts"`
  returns only the one above. `robots.ts` disallows `/api/` defensively
  (no such route exists today; kept in case one is ever added).
- **Middleware**: none (`find . -maxdepth 1 -iname "middleware.*"`
  returns nothing).
- **Edge runtime**: not used anywhere — every route runs on the default
  Node.js runtime (no `export const runtime = 'edge'` in the tree).

This is a stock Next.js 15 App Router application with no framework
extensions, no custom server, no monorepo tooling. It has no
architectural requirement that points at any platform in particular —
the choice below is about tooling fit and risk, not a forced constraint.

---

## 2. Deployment platform: Vercel

**Chosen over Cloudflare.** Reasoning, not a default preference:

- The app needs Server Actions and a Route Handler on the standard Node
  runtime, both of which Vercel supports natively with zero
  configuration — it's the reference platform for exactly this shape of
  app (Vercel built and maintains Next.js).
- Cloudflare Pages/Workers requires the `@cloudflare/next-on-pages` (or
  OpenNext-for-Cloudflare) adapter for App Router Server Actions and
  Route Handlers. That adapter's compatibility with this specific
  combination (Server Actions + a Route Handler that sets cookies and
  redirects + `next/image` + `next/font/google`) was unverified going
  into this deploy, and this session had no Cloudflare tooling connected
  to verify it against. Choosing it would have meant a real first-deploy
  risk with no way to check it ahead of time.
- This session already has a connected Vercel MCP integration (project/
  deployment tooling), so Vercel could be verified and driven directly
  rather than asked about secondhand.

**If Cloudflare is chosen later instead**, verify before switching:
current `@cloudflare/next-on-pages`/OpenNext support for this Next.js
version and Server Actions specifically; whether the Workers runtime
requires any code changes (some Node APIs aren't available on Workers by
default — this app doesn't use anything exotic, but `lib/file-store.ts`
writes to the local filesystem, which does **not** work on Workers at
all and would need a real backing store first, independent of which
platform is chosen); environment variable configuration in the
Cloudflare dashboard/Wrangler; caching behavior (Cloudflare's default
cache rules differ from Vercel's); `next/image` behavor (Cloudflare
Images or a custom loader, since the default Vercel image optimizer
isn't available); and that `/r/[code]`'s Set-Cookie + redirect behaves
identically under the Workers runtime.

---

## 3. Vercel-specific verification

**Next.js compatibility.** Next.js 15.5.25, React 19 — both fully
supported by Vercel's build system; no version pin issues.

**Build configuration.**

| Setting | Value | Source |
|---|---|---|
| Framework | Next.js (auto-detected) | `next` in `package.json` |
| Build command | `next build` (default) | `package.json` `scripts.build` |
| Install command | `npm install` (default) | `package-lock.json` present |
| Output directory | `.next` (default, framework-managed) | — |
| Root directory | repository root | no monorepo structure |
| Node version | Vercel default (≥18.18, per `package.json` `engines`) | `package.json` |

No custom `vercel.json` exists in this repository (only inside
`legacy/`, which is excluded from the Next.js build via `tsconfig.json`
`exclude` and isn't part of this app at all) — Vercel's Next.js
auto-detection handles everything above without one.

**Environment variables.** None are required for the site to build or
run — every optional one degrades safely when unset (this is a
deliberate, tested property of the CRM/analytics abstractions, not an
oversight):

| Variable | Effect if unset | Effect if set |
|---|---|---|
| `CRM_PROVIDER` | `console` (file-backed local log, `lib/file-store.ts`) | `webhook` or `hubspot` |
| `CRM_WEBHOOK_URL` | n/a unless `CRM_PROVIDER=webhook` | POST target for lead webhooks |
| `CRM_WEBHOOK_SECRET` | webhook sent without `Authorization` header | webhook sent with `Bearer` auth |

**No environment variables are set for this deployment** — see §5,
"What this preview intentionally does not prove."

**Caching.** Static and SSG routes are served from Vercel's CDN/edge
cache automatically (framework-default behavior, nothing custom
configured). The two dynamic routes (`/blog`, `/r/[code]`) are
correctly *not* cached the same way — `/blog` reads `searchParams` per
request, and `/r/[code]` sets a cookie per request — Next.js's own
route-type detection (static vs. dynamic) already handles this
correctly based on what each route actually does; nothing extra needed.

**Image behavior.** `next/image` is used in `components/blog/BlogCard.tsx`
and `components/blog/ArticleHeader.tsx` for a post's `featuredImage`,
and inside `components/blog/ArticleBody.tsx` for in-body markdown
images — all local-path-shaped (`/public/...`) or, if ever set to a
remote URL, would need a `next.config.mjs` `images.remotePatterns` entry
for that specific domain (none is configured, because no real
`featuredImage` currently exists on any of the three real posts — this
is an honest gap, not a bug: see `docs/decisions.md` ADR-014). The
showcase system deliberately uses a CSS `background-image` instead of
`next/image`, specifically so an arbitrary future client-hosted
screenshot URL never needs a config change (`ADR-008`). On Vercel,
`next/image` gets automatic on-the-fly optimization at the edge with no
extra configuration — this is one of the platform-fit reasons Vercel
was chosen over an adapter-based alternative.

**Route handling.** Verified directly against the deployed preview
(§5) — and this is exactly where a real, Vercel-specific bug surfaced
that no local testing caught: see §5's "What actually broke" below.
Every static/SSG route and both Server Actions resolved correctly with
no 404s/500s; the Route Handler did not, until fixed.

**API functionality.** N/A — no REST API routes exist in this app (§1).

---

## 4. What was verified before this deployment

Full detail: `docs/decisions.md` ADR-017 (the pre-launch QA pass this
deployment follows directly). Summary: `npm run typecheck`/`lint`/`build`
all clean; a full functional/responsive/accessibility/SEO/performance/
security/business/CRM QA sweep found and fixed six real bugs (fonts
never actually loading, the audit tool silently failing to submit, a
stale/false SEO description on `/websites/25000`, a keyboard focus trap
in the closed mobile menu, a missing 404 page title, unescaped JSON-LD).
Every fix was verified live in a browser, not just by a green build.

---

## 5. First deployment — preview

**Method:** the repository was linked to a new Vercel project
(`forge-marketing`, team `rishiidevs-projects`) via Vercel's GitHub
integration, after committing and pushing this session's QA fixes to
the existing `rebuild` branch (`19750d0`). GitHub's repository default
branch is `main`, which still holds the **untouched legacy static
site** (`docs/architecture.md` — the pre-rebuild HTML/CSS/JS, not a
Next.js app at all) — Vercel's project defaults its *production*
branch to `main` accordingly. **This deployment intentionally targets
the `rebuild` branch as a preview only; production has not been
touched and will not build correctly from `main` until `rebuild` is
merged into it** — that merge is a decision for the project owner, not
something this deployment pass makes on its own.

**Preview URL:** `https://forge-marketing-git-rebuild-rishiidevs-projects.vercel.app`
(the branch alias — stable across redeploys of `rebuild`; also carries
Vercel Authentication by default on a new Hobby-team project, so viewing
it directly requires either being logged into that Vercel account or a
temporary share link).

**What actually broke on Vercel that nothing local caught.** Two real,
environment-specific failures, both found by testing the *deployed*
app, not by local `dev`/`build`:

1. **The build itself was blocked** on first attempt —
   `next-mdx-remote@5.0.0` has a known CVE, and Vercel's build pipeline
   refuses to build a known-vulnerable dependency version outright (a
   check no local tool in this project runs). Fixed by upgrading to
   `6.0.0`; full detail `docs/decisions.md` ADR-018.
2. **`/r/[code]` returned a hard 500** on the running deployment, for
   every code. Root cause: `lib/file-store.ts` (the storage behind both
   `lib/referrals.ts` and the CRM's `console` provider) tries to `mkdir`
   a `.data/` directory at runtime — which fails on Vercel's serverless
   filesystem (`ENOENT ... mkdir '/var/task/.data'`, confirmed via
   `get_runtime_errors`), since a Lambda-style deployment bundle is
   read-only. `app/actions.ts`'s lead-capture Server Actions already
   catch this exact failure gracefully (verified: submitting the
   homepage form on the live deployment correctly showed "The CRM is
   temporarily unavailable," no crash) — `app/r/[code]/route.ts` simply
   never had the equivalent `try`/`catch`. Fixed to degrade the same way
   every other storage-touching code path already does: on any failure,
   redirect to `/audit` without attribution, exactly like an
   unrecognized referral code already did. Full detail:
   `docs/decisions.md` ADR-019.

**What this preview still does not prove, by design (not a bug):**

- **Lead delivery.** No `CRM_PROVIDER` is set on this Vercel project.
  Every lead submitted is caught and reported as "temporarily
  unavailable" (see above) rather than actually stored anywhere durable
  — `lib/file-store.ts` cannot write on Vercel's serverless filesystem
  at all, confirmed directly, not assumed. This is the same known,
  pre-existing limitation of the `console` provider documented in
  `docs/crm.md` "Known limitations," now confirmed to manifest as a
  clean failure rather than silent data loss — but it is still **not
  something this deployment pass fixes**. A real deployment that needs
  to actually capture leads must set `CRM_PROVIDER=webhook` and
  `CRM_WEBHOOK_URL` to a real, persistent destination first (HD#11,
  still open).
- **Real contact channel.** `SITE.whatsappNumber`/`supportEmail` are
  still `null` (HD#13, still open) — the WhatsApp float button renders
  nothing, same as in every environment.
- **Real domain.** This preview is on Vercel's own generated URL, not
  `forge.bruuhh.com` — no DNS was touched, per explicit instruction for
  this pass.

### Preview testing checklist — run and completed against the deployed preview itself

All items below were run directly against
`https://forge-marketing-git-rebuild-rishiidevs-projects.vercel.app`
(not localhost) on 2026-09-06, after the two fixes in ADR-018/ADR-019.

- [x] `/` loads, hero/pricing/showcases/FAQ all render (fonts confirmed genuinely loaded, not just locally)
- [x] `/audit`, `/websites`, `/websites/5000`, `/websites/15000`, `/websites/25000`, `/maintenance`, `/showcases` + all 3 detail pages, `/blog` + all 3 posts, `/tools`, `/design-system` — every route fetched, all `200`
- [x] `/websites/25000`'s SEO description confirmed fixed on the live deployment (no longer says the tier doesn't exist)
- [x] `/design-system` confirmed `noindex` on the deployed HTML (`<meta name="robots" content="noindex">` present)
- [x] `/sitemap.xml`/`/robots.txt` resolve; sitemap's `<loc>` values correctly point at `forge.bruuhh.com` (the real domain, from `SITE.marketingUrl`), **not** this preview's own hostname — expected, not a bug: re-verify once actually promoted to that domain
- [x] `/r/anything` — **failed on the first deployment (hard 500), fixed (ADR-019), now redirects to `/audit` correctly**, confirmed both via `fetch` (opaque redirect) and by navigating there directly
- [x] A random nonexistent path returns a real `404`
- [x] Homepage lead form submits; shows "The CRM is temporarily unavailable" (correct — no `CRM_PROVIDER` set, and the file-store provider cannot write on Vercel's serverless filesystem at all, confirmed directly — see ADR-019). No crash, no silent failure — an honest status the visitor can see.
- [x] Mobile viewport (375px): hamburger menu opens (panel `inert=false`, real height), closes (`inert=true` immediately), no layout breakage
- [x] External link `rel="noopener noreferrer"` + `target="_blank"` confirmed in source on every use (showcase "Visit the live site", `WhatsAppFloat`) — not re-clicked through on the live deployment specifically, already verified locally and in code
- [x] HTTPS — the deployment URL is `https://` by default (Vercel-provisioned, no manual step)
- [ ] HTTPS: confirm the preview URL is `https://` (Vercel provisions this automatically — no manual step)

**Known, expected discrepancy to check for specifically:** because
`SITE.marketingUrl` in `lib/constants.ts` is hard-coded to
`https://forge.bruuhh.com`, the preview's own `sitemap.xml`, canonical
tags, and OpenGraph URLs will all point at the *real* domain, not the
preview's own URL. This is correct behavior for when this eventually
ships to the real domain, but means **do not judge SEO-tag correctness
by comparing them to the preview's own hostname** — compare them to
`forge.bruuhh.com` instead, and re-verify once actually promoted to that
domain.

---

## 6. Promoting to production — checklist

Do not promote until every item above is checked on the deployed
preview itself, not assumed from a passing local build. Additionally,
before promoting:

- [ ] Resolve HD#13 (real contact channel) or explicitly accept
      launching without one
- [ ] Set `CRM_PROVIDER`/`CRM_WEBHOOK_URL` to a real, persistent
      destination, or explicitly accept that leads are not being
      captured yet
- [ ] Decide the `main`/`rebuild` branch situation — either merge
      `rebuild` into `main` (so Vercel's production branch actually
      contains this app) or reconfigure the Vercel project's production
      branch to `rebuild` directly
- [ ] Point `forge.bruuhh.com`'s DNS at the Vercel project (only once
      the above are settled — see `README.md`/`docs/session-handoff.md`
      for the domain's current status)
- [ ] Re-run every item in the preview testing checklist above against
      the **production** URL after promotion — a preview passing is not
      proof production will, since production is a different
      deployment, potentially with different environment variables
- [ ] Confirm real analytics/CRM vendor decisions (HD#12, HD#11) before
      relying on any data from the live site

This checklist intentionally does not get shorter just because a
preview passed. "Deployed and reachable" and "safe to point real
customers at" are different bars, and this document treats them as
such.
