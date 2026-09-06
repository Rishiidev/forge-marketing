# SEO System — Audit, Fixes, and Organic Growth Architecture

> Public marketing site only (`forge.bruuhh.com`). The customer app and internal admin app (`forge-platform` repo) are the opposite posture — deliberately never indexed. See that repo's own `docs/seo-system.md` for the boundary and enforcement detail; this file only covers `forge-marketing`.

Written by the **SEO/organic-growth session** (2026-09-07). Full detail of what changed, file by file: `docs/session-handoff.md` §17.

## 1. Audit methodology

A read-only SEO audit ran first, before any fix — per the explicit instruction "audit existing SEO before changing anything" and "do not blindly rewrite working SEO." It checked, against the real rendered `.next/server/app/*.html` build output (not guesswork): title tags, meta descriptions, canonical URLs, robots meta/`X-Robots-Tag`/`app/robots.ts`, `app/sitemap.ts` completeness, structured data (JSON-LD), Open Graph/Twitter cards, heading structure, image alt text, internal linking, duplicate/thin content, and code-level performance red flags — across every real route (homepage, `/audit`, `/blog` + 3 posts, `/showcases` + 3 entries, `/tools` + 12 tools, `/websites` + 3 tiers, `/maintenance`; `/design-system` excluded as an intentional, documented noindex).

## 2. What was already correct — left untouched

- **Titles**: all 27 real routes unique, no duplicates, reasonable length.
- **Canonical URLs**: every page has a correct, absolute canonical (`lib/seo.ts`'s `buildMetadata()`).
- **`robots` meta**: nothing accidentally noindexed outside `/design-system` (intentional) and `/_not-found` (correct).
- **`app/robots.ts`**: correctly allows `/`, disallows `/r/` and `/api/`, declares the sitemap.
- **`app/sitemap.ts`**: exactly the 28 real URLs (7 static + 3 tiers + 3 showcases + 3 blog posts + 12 tools) — auto-tracks new content via `getAvailableTools()`/`getAllShowcases()`/`getAllPosts()`, nothing phantom.
- **Meta descriptions** (except `/audit`, fixed — see §3), **heading structure** (one real h1 per page, no skipped levels), **image alt text** (no raw `<img>`, everything through `next/image` or a documented `role="img"` pattern), **existing JSON-LD** (`BreadcrumbList`, `BlogPosting`, `CreativeWork`+`LocalBusiness`, `WebApplication`+`Offer` on tool pages — all sourced from real frontmatter/data, nothing fabricated), and **Core Web Vitals code smells** (no unoptimized `<img>`, the one heavy client component — the homepage's shader background — is properly `useEffect`-gated and `IntersectionObserver`-scoped, not blocking).

## 3. What was fixed this session

| Finding | Fix |
|---|---|
| `/tools` hero copy said "nothing is live here yet" above a grid of 12 real tools | Rewrote `app/tools/page.tsx`'s `PageHero` to describe what's actually there |
| Zero pages emitted `og:image`/`twitter:image` | `lib/seo.ts` now falls back to `/logo.png` (the real site mark) when a page doesn't supply its own — not a fabricated image |
| No favicon anywhere | Added `app/icon.png` (Next.js's automatic favicon route) from the existing `public/logo.png` |
| No site-wide `Organization` JSON-LD | Added once, in `app/layout.tsx`, sourced from `SITE` — `sameAs`/`contactPoint` deliberately omitted (no confirmed support email/social profiles exist yet, per `docs/forge-business-rules.md`'s open Human Decisions; never invent one) |
| The three pricing-tier pages (the site's only concrete prices) had no commercial schema | Added `Product`/`Offer` JSON-LD in `components/pricing/WebsiteTierPage.tsx`, only for a tier with a real (non-`'tbd'`) price |
| `/audit`'s meta description was 222 characters (truncates past ~155–160) | Trimmed to 160 |
| Internal linking was one-way — all 12 tool pages link out to `/audit`/`/websites`/each other, but nothing linked back in | Added three real, contextual links: `/websites` → `/tools` (new closing section), one showcase → `/tools/website-health-check`, one blog post's mobile section → `/tools/mobile-website-check`. Deliberately not a mechanical "add a tools link to every page" pass |

All re-verified: `npm run typecheck`/`lint` clean, `npm run test` 144/144, `npm run build` 35/35 routes.

## 4. Cannot verify without a live deployment

Real HTTP status codes/redirect chains, actual Core Web Vitals (LCP/CLS/INP), real bundle/network-waterfall behavior, and whether the 12 tools' live findings for a real submitted URL differentiate enough in practice (only the static template/category overlap was checkable — see §5).

## 5. Flagged, not fixed — a product decision

`website-seo-audit` and `website-health-check` (two of the 12 tool pages) have near-total category overlap: health-check's check list (`lib/website-analyzer/tools.ts`) is a strict superset of seo-audit's. For any given URL, seo-audit's entire finding set reappears inside health-check's. Visible template copy (title/description/methodology) is genuinely differentiated, and the shared FAQ/methodology-closing sentence is intentional (same engine, same trust language), but this is a real thin/duplicate-content risk worth a deliberate call — e.g. trimming seo-audit's scope so it's a genuine subset framed as "quick check," or accepting the overlap as intentional "quick vs. full" positioning. Not changed here without that decision, per "do not blindly rewrite working SEO."

## 6. The organic acquisition system (existing, verified — not rebuilt this session)

**Tools** (`/tools`, 12 real pages, `lib/website-analyzer/`): each runs a genuine analysis against the visitor's own homepage (fetch → parse → check), not a lookup or a lead-gated fake result — SSRF-mitigated, rate-limited, cached. Every tool page: real result → plain-language explanation → FAQ → a relevant Forge CTA (`/audit` or `/websites`) → related tools. This is the "engineering as marketing" pattern the instruction asked for, already built and functioning end-to-end (verified live against `https://example.com` during this session — a real 31-check result rendered).

**Content clusters** (`/blog`, 9 named clusters — `lib/blog.ts` `BLOG_CATEGORIES`: Google Business Profile, Local SEO, Business websites, Online credibility, Reviews, Website conversion, Lead generation, Local marketing, Digital presence): a closed taxonomy, not free-text, so `/blog`'s category filter and internal linking stay coherent. Only 3 real posts exist against these 9 clusters today — genuinely thin coverage, honestly represented (the blog page says so), not padded with placeholder posts.

**The funnel shape** (education → utility → evidence → offer): blog → tools → showcases → `/websites` (offer) → `/audit` (conversion), with `/audit` and `/websites` as the two commercial endpoints every other surface points toward. §3's internal-linking fixes close the one gap this session's audit found in that shape.

**Deliberately not done this session**: no new blog posts, no location pages, no keyword research was performed to justify new pages — per the explicit instruction to do keyword research before creating large numbers of pages, and this session's own scope being audit-and-fix, not content production. The highest-leverage next content move (a real keyword-researched pass to close the 9-cluster/3-post gap, or a first quote-calculator/business-calculator tool per `docs/tool-cost-matrix.md`'s remaining candidates) is left for a session scoped to do that research first.

## 7. Boundary with `forge-platform`

The customer app and internal admin app are a separate repository (`forge-platform`) and a separate SEO posture entirely — noindex on every route, by three independent layers (root metadata, `X-Robots-Tag` header, a disallow-all `robots.ts`). See that repo's `docs/seo-system.md` for the full enforcement detail. Nothing in this file applies there, and nothing there applies here.
