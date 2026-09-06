# Forge — Business Strategy & Rules

This is the business source of truth for Forge, for use by future Claude
Code sessions and by anyone working on the rebuild. Every claim below is
sourced from the existing codebase (the `main` baseline commit) — file and
line references are given so any statement can be re-verified against the
code. Nothing here is invented. Where the codebase is silent, contradicts
itself, or leaves a judgment call to a human, that is marked **TBD** rather
than guessed.

Read this document before writing customer-facing copy, pricing, or claims
of any kind. If this document conflicts with a specific page in the
baseline code, **this document wins** — that's the point of writing it.

---

## 1. Business positioning

Forge positions itself as a productized service — not an agency, not a
DIY website builder — that turns a local business's existing Google
Business Profile (GBP) into a professional website.

Source copy (`index.html` `<meta name="description">` and hero):
> "Forge turns your Google Business Profile into a professional website
> in 48 hours."
> "Your business is already trusted offline. Forge it online."

Footer tagline (used across most pages): *"Forging professional online
presence for local businesses."*

Stated design philosophy (`docs/legacy-readme.md`): no fake scarcity, no
shame copy, no fabricated testimonials, no decorative countdown timers —
"every claim on every page is defensible in a customer DM."

**TBD:** A single positioning statement doesn't exist — it's assembled
from hero copy across pages. Worth the business owner confirming this is
still the intended one-line pitch before it's used as a rebuild anchor.

## 2. Target customer

Fully documented in `forge-icp-and-templates.md`. Summary:

- **Primary persona:** "Anita, the Salon Owner" — local business owner,
  age 32–50, Tier 1 city (Mumbai, Bangalore, Delhi, Pune) or Tier 2
  (Indore, Nagpur, Jaipur, Lucknow), business 2–10 years old, revenue
  ₹8L–₹80L/year, team of 1–8, owner is always the sole decision-maker.
  Comfortable with WhatsApp, Instagram, Google Maps; does **not** use
  Notion, GitHub, Vercel, Figma, or PWA tooling.
- **Four sub-segments** (with revenue share, from the same doc):
  1. Local Practitioner (salon, clinic, fitness, coach, service) — 60%
  2. Growing Café / Studio — 15%
  3. B2B Service — 15%
  4. Auto / Trade — 10%
- **Anti-ICP** (explicitly do not sell to): startup founders, agency
  owners, non-Indian SMBs, "I have a friend who codes" prospects,
  enterprise procurement teams.

One-liner ICP (verbatim from the doc): *"Founders of 1–10-person service
businesses in Tier 1–2 Indian cities, 2–10 years old, ₹8L–₹80L/year, who
lose customers to competitors who look better online — but don't have
the time or money for a real website project."*

## 3. Primary customer problem

Core fear (`forge-icp-and-templates.md`): *"I'm losing customers to a
competitor who looks more professional online."*

Site framing (`index.html`, "wound" section): the business does good
work, but its online presence doesn't prove it — a Google listing tells
customers the business exists, not that it's worth trusting.

Named triggers that bring a customer to Forge: a customer said "I
checked your website but..."; they saw a competitor's site; they lost a
deal because they looked unestablished; a competitor's GBP had nicer
photos.

## 4. Why the customer should care

`index.html` "future" section frames the cost of inaction as a lost
customer, moment by moment: someone searches → finds a competitor with a
credible site → trusts them in seconds → the local business never knew
the customer existed. The claimed mechanism is trust-transfer at the
point of search, not abstract "you need a website" messaging.

Explicit non-promise, stated directly in copy (`index.html` FAQ; also see
§17/§18 below): *"No honest website can guarantee rankings, leads, or
revenue."* Care is framed around removing a specific, named friction
(hesitation caused by an unclear or absent web presence), not a
guaranteed-outcome pitch.

## 5. Free audit purpose

Source: `audit.html`.

- Lead magnet: a manual, 7-point review of the business's Google
  Business Profile and web presence, delivered as a private write-up.
- Free, no obligation, "no software report" — reviewed by a person.
- Delivered within 48 hours (`audit.html` hero copy). Note: `thanks.html`
  frames all post-submit follow-up as WhatsApp-first regardless of
  source — see §11 for the delivery-channel conflict this creates.
- Explicit no-upsell claim inside the audit itself: *"No upsell inside
  the audit."* The upsell only happens after, as one of two named next
  steps: ask for a private preview, or read the Operator plan
  (`audit.html` "Two next steps" section).
- Consent copy on the form: *"By submitting, you agree to receive one
  private audit and one optional follow-up. No list, no spam, no selling
  your data."*

## 6. ₹5,000 product

Source: `5000-setup.html` only. **This tier does not appear anywhere
else in the codebase** — `index.html`'s equivalent-tier price point is
₹9,999 (§ below), not ₹5,000. See the TBD at the end of this section.

As coded:
- Headline offer: *"Your business website, live in 45 minutes. ₹5,000,
  only if you love it."*
- Payment happens **after** the customer sees the live site and does a
  short WhatsApp walkthrough call — not upfront.
- Delivery: GBP link → Forge builds from a pre-existing industry
  template (salon/clinic/café/service/studio/coach) → live URL in
  roughly 30 minutes → 5-minute WhatsApp walkthrough → handover "by
  tomorrow."
- Included: real website from the GBP, mobile-first layout, WhatsApp +
  Call buttons, custom domain registered in the customer's name,
  business email setup, a Cloudflare account created and shared with the
  customer, Google Business Profile linking/optimization, live preview
  before payment, 14-day bug support.
- Explicitly **not** included: custom design from scratch, custom
  copywriting beyond the GBP, **any revisions** to template layout or
  copy, logo design, custom photography, booking/payment/CRM systems,
  hosting beyond Cloudflare's free tier, monthly maintenance.
- FAQ on the page directly addresses the price conflict with the main
  site: *"Why ₹5,000 and not ₹9,999 or ₹24,999 like the main site
  shows? ... It's a different offer for a different buying pattern."*
  This is the only place in the codebase that acknowledges the two
  funnels coexist.

**TBD:** Is the ₹5,000 tier the current live offer, a discontinued
experiment, or a deliberate parallel funnel for a different acquisition
channel? The page's own FAQ implies "different offer, different buying
pattern" was a real decision at some point — but nothing in the
repository confirms whether that's still the intended state or which
funnel (this one or `index.html`'s ₹9,999 tier) should be the one true
"first paid tier" going into the rebuild.

## 7. ₹15,000 product

Source: `5000-setup.html`, upsell ladder, "Tier 2 — Custom Site."

- Price: ₹15,000 one-time.
- Scope: "Everything in ₹5,000 + custom design from scratch, custom
  copywriting, your logo, custom palette and font."
- Positioning: *"You want the site to feel specifically yours — not a
  great template."*

**TBD:** This occupies roughly the same market position as the
₹24,999 "Made-For-You Website" on `index.html`/`made-for-you.html`
(custom design + custom copy), but at a different price and with a
narrower feature set (no stated conversion engine, no stated page count,
no stated revision count, no stated delivery time). Whether ₹15,000 and
₹24,999 are the same product mis-priced across two pages, or genuinely
different tiers, is unresolved.

## 8. ₹25,000 product

**No ₹25,000 product exists anywhere in the current codebase.** This is
stated plainly rather than approximated, since the brief names this
figure specifically. The two closest real price points are:

- **₹24,999** — "Made-For-You Website" (`index.html`, `made-for-you.html`,
  `bespoke-quote.html`): custom design from scratch, custom copy written
  for the business, one conversion engine included (service picker,
  booking calendar, or quote wizard), custom palette/font pair, up to 8
  pages, 5–7 day delivery, 2 revisions, 30-day bug support. The
  `bespoke-quote.html` calculator can push this total up to a hard cap of
  ₹74,999 depending on selected add-ons.
- **₹30,000** — "Custom + Active" (`5000-setup.html`, Tier 3 of the
  upsell ladder): everything in the ₹15,000 tier + a conversion engine +
  3 months of the Operator plan bundled in.

**TBD (human decision required):** Confirm whether "₹25,000" in the
brief was shorthand for the ₹24,999 tier, a rounding of the ₹30,000
tier, or an intended new price point that hasn't been coded yet. This
document does not guess.

## 9. Maintenance offer

Two different structures exist in the codebase for the same concept
("Operator plan," ongoing monthly management):

**`operator.html` (the dedicated Operator Prospectus page) — three
tiers:**

| Tier | Price/mo | Scope |
|---|---|---|
| Steady | ₹1,499 | Hosting/SSL/backups/monitoring, 1 small content update/mo, 14-day bug support, monthly check-in email |
| Active *(featured, "most businesses")* | ₹3,999 | Everything in Steady + up to 3 updates/mo, quarterly 7-point audit re-review, 2 small design updates/quarter, 48-hour issue response |
| Forged | ₹7,999 | Everything in Active + monthly updates, early access to Reviews/SEO layer, priority access to Bookings/CRM layer, direct line to Forge |

Always included on every tier: hosting, SSL, backups, uptime monitoring,
domain/DNS renewal care, security updates, a monthly summary email, and
an explicit ownership clause (see §10). Capped at **8 active clients**
total across all tiers (`operator.html` hero + commitment section, and
restated in `terms.html` §"The four offerings").

Explicit exclusions from every tier (`operator.html` "Not included"):
new pages/sections/features beyond launched scope, logo/brand work, ad
campaigns or social media management, copywriting beyond light edits,
photography/video production, major replatforming.

**`5000-setup.html` (upsell ladder) — a single flat rate:** *"Operator
Plan — ₹1,999/month. Monthly updates, hosting oversight, content swaps,
seasonal promos. Cancel anytime."*

**TBD:** These two structures don't reconcile — ₹1,999/mo doesn't match
any of the three `operator.html` tiers, and it's unclear whether
₹1,999/mo is an intended fourth (cheaper) tier, an outdated number, or a
simplified summary meant for a different audience. Needs a decision on
one canonical maintenance-pricing structure.

## 10. Customer ownership policy

This is the one policy area that is **consistent across every page** —
no conflict found, safe to treat as settled:

- The domain is always registered in the customer's name, never Forge's
  (`index.html`, `operator.html`, `5000-setup.html`, `terms.html`).
- Website files/project files transfer to the customer after final
  payment (`index.html` trust section, `made-for-you.html`, `terms.html`
  "Intellectual property").
- For the ₹5,000 tier specifically: the Cloudflare account is created
  with the customer's own email, and the password is shared with them —
  *"You can take everything with you if you ever stop using Forge"*
  (`5000-setup.html` FAQ).
- The Operator plan explicitly "manages the website, never owns it"
  (`operator.html` "Always included").
- `terms.html` "Intellectual property" clause is the most precise
  statement: *"Until full payment, the preview and the website remain
  Forge intellectual property. After full payment for the launch
  package, the website files become yours. The underlying tooling,
  components, and methods remain Forge intellectual property."* The
  Operator plan grants a license to use the live site, not the
  underlying tooling.

## 11. Delivery process

**Not consistent across tiers — three different documented processes
exist:**

1. **₹9,999 / "48-Hour Website" (`index.html`, `terms.html`):** send GBP
   link → private preview within 24 hours → customer approves → 50%
   deposit reserves the slot and starts customization → 50% due before
   the domain goes live → launch within 48 hours of approval + deposit +
   required domain access. Conditional guarantee: if Forge misses the
   48-hour deadline for a reason within its control, the deposit is
   refunded in full (not refunded if the delay is the client's).

2. **₹5,000 setup (`5000-setup.html`):** send GBP link (~2 min) → Forge
   builds from template (~30 min) → 5-minute WhatsApp walkthrough call
   (~10 min), where the customer decides live on the call whether to
   proceed → if yes, handover (domain/email/Cloudflare/GMB) "by
   tomorrow." Payment happens after the walkthrough, not before.

3. **₹24,999 Made-For-You (`made-for-you.html`):** Day 1 kickoff call →
   Days 2–4 build → Day 5 preview (2 revisions available) → Day 7 live,
   domain connected, files transferred on final payment. Payment
   structure per `bespoke-quote.html`: ₹2,499 deposit to reserve the
   slot and start kickoff, 50% more on preview approval, balance before
   launch.

**Follow-up channel is also inconsistent:** `audit.html` and the
consent copy imply email delivery; `thanks.html` (the generic
post-submit page) frames every outcome as WhatsApp-first regardless of
which form was submitted; `forge-wa-submit.js` actually implements
WhatsApp as the only real-time channel (it opens a pre-filled WhatsApp
chat on submit) with the `/api/submit` POST as a silent backup — no code
path currently sends the customer an email confirmation.

**TBD:** Which delivery process and payment-split structure is
canonical depends directly on which pricing tier (§6–§8) is canonical.
This can't be resolved independently of that decision.

## 12. Revision policy

Three different revision allowances exist, one per tier, and they do
not obviously form a coherent ladder:

- **₹5,000 setup:** explicitly **zero** revisions — *"Revisions to
  template layout or copy"* is listed under "Not included"
  (`5000-setup.html`).
- **₹9,999 / 48-Hour Website:** **1 revision**, defined narrowly as
  "changes to the agreed page after the preview" — not a new page, new
  workflow, or a full change of direction; anything beyond that is
  scoped and quoted separately (`index.html` FAQ, `terms.html`).
- **₹24,999 Made-For-You:** **2 revisions** (`index.html` compare table,
  `made-for-you.html`).

**TBD:** Whether the ₹5,000 tier's zero-revision policy and the ₹9,999
tier's one-revision policy are two eras of the same product (see §6) or
intentionally different tiers needs a decision before this can be
written as a single ladder.

## 13. Refund / payment policy

This is one of the more fully specified areas — `terms.html` "Refunds"
section, quoted directly:

- **Free services** (preview, audit, waitlist): nothing to refund.
- **Launch deposit:** refundable in full if Forge misses the 48-hour
  launch deadline for a reason within its control. Not refundable if the
  delay is on the client's side.
- **Final 50%:** not refundable once the website is live and delivered.
  Bugs are fixed during the 14-day support period instead.
- **Operator plan:** cancel any month; the current month is not
  refunded, but it does not auto-renew after cancellation.

Related terms from the same page:
- Liability is capped at the amount paid to Forge in the 12 months
  before a claim; no liability for indirect/incidental/consequential
  damages including lost revenue.
- Governing law: India; disputes go through good-faith conversation
  first, then arbitration "in the city where Forge operates" (city not
  named in the document itself).

**TBD:** This refund policy is written specifically around the "50%
deposit / 50% final" structure of the ₹9,999 tier (§11, process #1). It
does not address the ₹5,000 tier's "pay only after you see it" model or
the ₹24,999 tier's three-part payment split (₹2,499 / 50% / balance) —
those payment structures have no matching refund clause anywhere in the
codebase.

## 14. Referral program

**Nothing in the codebase.** No referral form, referral code, referral
discount, or affiliate mechanism exists on any page or in any script.
`thanks.html` has a "Forge is not just the launch" section, but it
describes the product roadmap (Reviews/SEO → Bookings/CRM phases), not a
referral program.

**TBD (human decision required):** Whether a referral program should
exist at all is entirely undecided — this isn't a case of conflicting
implementations, it's simply unbuilt.

## 15. Review/testimonial policy

**No testimonial-collection mechanism exists in the codebase.** What
does exist is an explicit *anti*-fabrication stance, stated in multiple
places:

- `index.html` trust footnote: *"Forge does not use fake testimonials,
  review counts, or claimed conversion numbers. Every claim on this page
  is defensible."*
- `docs/legacy-readme.md`: *"no fabricated testimonials... every claim
  on every page is defensible in a customer DM."*
- `forge-icp-and-templates.md` anti-patterns list, repeated per
  industry template: *"testimonials with no last name"* is called out as
  something to avoid.

The same ICP doc lists "testimonial collection" as a *named future
Operator-plan upsell feature* for the coach/consultant template
(₹3,999/mo tier), but this is template-design copy, not an implemented
policy or workflow.

**TBD:** No documented policy exists for *how* Forge would ethically
collect and use a real testimonial once a customer gives one (consent
language, attribution rules, where it's allowed to appear). This needs
to be written before any testimonial ever ships on the site — the only
existing rule is "don't fake it."

## 16. Showcase / case-study policy

**One real showcase section exists**, on `5000-setup.html` only — three
named, linked, live client sites (Smile Care Dental Clinic, Asquare
Venture, We Health Care Diagnostic Centre), each with a real city,
category, and a specific claimed metric (e.g. "4.9★, 82 Google reviews,"
"booked in 47 minutes from a single GBP share link"). This is the only
place in the codebase with real client proof; it does not appear on
`index.html` or anywhere else in the main funnel.

**TBD (human decision required):**
- No documented consent process exists for using a client's business
  name, city, or metrics publicly — whether these three clients
  explicitly agreed to be showcased isn't something the codebase can
  answer.
- No policy exists for which future clients get showcased, when, or how
  metrics are sourced/verified before publishing them.
- Whether this showcase should be promoted to the main funnel (it
  currently isn't) is a business decision.

## 17. Marketing claims that are allowed

Inferred from what the codebase actually does, consistently, across
pages — these are the patterns already in use and considered safe to
continue:

- Specific, checkable numbers tied to a real mechanism (e.g. "6 of 6
  launch slots remain this month," driven by an actual `CAP` config
  value in `index.html`, not decorative copy).
- Named, falsifiable process steps (e.g. "50% to reserve, 50% before
  launch," "1 revision, 14-day bug support") rather than vague
  reassurance.
- Explicit non-promises stated alongside promises (`terms.html` "What we
  do not promise": no ranking guarantee, no lead/revenue guarantee, no
  guaranteed customer count).
- Direct acknowledgment of limits/tradeoffs in copy (`5000-setup.html`
  FAQ answering "why is this cheaper than the main site" honestly rather
  than hiding the discrepancy).
- Real, named, linked client examples with specific claimed outcomes,
  when actually true (the three `5000-setup.html` showcase entries) —
  contingent on the consent question in §16 being resolved.

## 18. Marketing claims that are prohibited

Directly stated in the codebase's own design philosophy
(`docs/legacy-readme.md`, `index.html` trust footnote) and consistent
with the psychology principles section below:

- No fake or decorative scarcity — the launch cap and waitlist cap must
  be real numbers tied to real capacity, not theater.
- No fabricated urgency (no countdown timers of any kind).
- No fabricated testimonials, reviews, or review counts.
- No fabricated or unverifiable metrics ("claimed conversion numbers"
  is named explicitly as prohibited).
- No guarantee of rankings, leads, calls, revenue, or customer count
  (`terms.html` "What we do not promise") — any copy implying a
  guaranteed sales outcome contradicts existing terms and must not ship.
- No shame-based copy (`docs/legacy-readme.md` explicitly rules out
  patterns like "your business is losing ₹X daily").
- No em-dashes (a stated house style rule in `docs/legacy-readme.md`,
  included here only because it's an explicit, existing instruction —
  not a claims/ethics rule, but worth carrying forward).

## 19. Customer data rules

Source: `privacy.html` (Effective 16 July 2026) — the most detailed
policy document in the repo. Key rules as written:

- No advertising cookies, no third-party trackers, no ad tracking of any
  kind on the site (confirmed independently — see §21, zero analytics
  scripts exist in the codebase).
- Per-form data collection is minimal and enumerated exactly: the
  preview form collects only a GBP link + optional WhatsApp number (no
  name/email required); the audit form additionally collects name,
  email, business name, category; the waitlist form mirrors the audit
  form; the Operator enquiry form collects only email + optional
  WhatsApp.
- Stated retention windows: preview requests 90 days after delivery,
  audit requests 12 months, waitlist entries 90 days (auto-removed if
  unclaimed), Operator enquiries 12 months or the life of an active
  plan.
- Stated sharing policy: *"No one. Not for marketing. Not for resale.
  Not for any reason,"* with exactly two named exceptions: **Vercel**
  (hosting) and **Resend** (\"a form-handling service... receives form
  submissions and forwards them to email and CRM\"), plus legal
  compulsion.
- User rights: access, correction, deletion on request, actioned within
  seven days, by email only (no self-service portal, "because this is a
  one-person studio").
- Not for children under 18.

**TBD / discrepancy requiring correction (not just a decision — this is
a live accuracy gap between policy and code):**
- `api/submit.js` actually sends every lead to **three** services, not
  two: Resend (email), **Supabase** (a durable Postgres database), and
  **GitHub** (a private-repo JSON backup, one file per lead, committed
  via the GitHub API). Neither Supabase nor GitHub is disclosed anywhere
  in `privacy.html`'s "Who we share it with" section.
- `privacy.html` states *"We do not enrich the data, score you, or
  retarget you."* `api/submit.js` explicitly computes and stores a
  `priority_score` field on every lead (operator=3, audit=2, preview=2,
  waitlist=1) — this is lead scoring, directly contradicting the stated
  policy.
- The stated retention windows (90 days / 12 months) have no
  corresponding deletion mechanism anywhere in the codebase — no
  scheduled job, no TTL configuration visible in the repo. Whether
  deletion happens manually, happens in Supabase config not present in
  this repo, or doesn't happen at all cannot be determined from the
  code alone.

This means `privacy.html`, as currently written, is **not an accurate
description of what the code does**. This must be fixed — either the
code changes to match the stated policy, or the policy is rewritten to
match the code — before the rebuild ships. Do not copy the current
privacy.html text forward without resolving this.

## 20. CRM lifecycle

**No sales-pipeline lifecycle is implemented.** What exists in
`api/submit.js` is a single-stage lead capture:

- Every submission becomes one row (Supabase) / one JSON file (GitHub)
  with: `source`, `name`, `email`, `biz`, `link`, `whatsapp`,
  `category`, `tier`, `waitlist_position`, `message`, `reference`
  (a generated code like `PRV-XY4Z`), `ip`, `user_agent`,
  `priority_score`, and per-leg delivery statuses
  (`resend_status`/`supabase_status`/`github_status` — these track
  whether the *notification* succeeded, not the lead's sales stage).
- `priority_score` ranks sources by assumed intent: operator=3,
  audit=2, preview=2, waitlist=1. This is the only prioritization logic
  that exists.
- There is no "new / contacted / qualified / won / lost" stage field,
  no assignment logic, no follow-up scheduling, and no integration with
  an external CRM tool beyond the raw data landing in Supabase.

**TBD:** Whether Forge uses Supabase itself as the CRM (querying leads
directly), pipes it into a separate CRM tool manually, or intends to
build pipeline stages into the rebuild is undecided — nothing in the
codebase answers this.

## 21. Analytics events

**Zero analytics implementation exists in the codebase.** Confirmed by
direct search: no Google Analytics/`gtag`, no Meta Pixel/`fbq`, no
PostHog, Mixpanel, or Segment snippet on any page. `vercel.json`'s CSP
`connect-src` only allowlists `'self'`, `api.resend.com`,
`*.supabase.co`, and `api.github.com` — no analytics domain is even
permitted to load under the current Content-Security-Policy, which
independently confirms this isn't a case of a script existing but being
blocked; analytics was never added.

The only quantitative visibility into funnel behavior is whatever can be
derived after the fact from the `source` field on each captured lead in
Supabase/GitHub (i.e., which form was submitted), and from Vercel's own
request logs (mentioned in `privacy.html` as short-window, provider-side
only).

**TBD (human decision required):** No event taxonomy exists to carry
into the rebuild. This needs to be designed from scratch — including
whether Forge wants any analytics/tracking at all, given the explicit
"no third-party trackers" privacy commitment in §19. Any analytics
decision must be reconciled with that existing public promise, not
bolted on separately.

---

## Psychology principles

These are the ethical persuasion principles Forge should use going
forward. They are largely already reflected in the existing code (cited
where true) and should guide new copy and design decisions in the
rebuild.

- **Reduce uncertainty.** Show the customer exactly what happens next at
  every step (`index.html`'s 4-step "future" narrative; `thanks.html`'s
  4-step timeline with concrete time windows).
- **Reduce perceived effort.** Frame the ask as small and singular — "send
  one Google link" (`index.html` "relief" section) — rather than
  describing everything Forge will do.
- **Make the outcome concrete.** Use a real before/after comparison tied
  to the customer's actual GBP data, not abstract benefit language
  (`index.html`'s before/after slider).
- **Show real proof.** Use only real, named, verifiable examples (the
  `5000-setup.html` showcase, once the consent question in §16 is
  resolved) — never invent one.
- **Use specificity over hype.** Prefer "1 revision, defined as changes
  to the agreed page" over "unlimited revisions" or "as many changes as
  you need" — specific, bounded claims are both more honest and more
  credible.
- **Use transparent pricing.** State exact numbers and what they include
  (already the pattern on every pricing page) instead of "starting at"
  framing or hidden-until-call pricing.
- **Show the actual process.** Numbered, timed steps
  (`5000-setup.html`'s "01/~2 min, 02/~30 min..." flow) rather than a
  vague "we'll be in touch."
- **Reduce commitment before the sale.** Free audit with no obligation;
  private preview before any payment; the ₹5,000 tier's "pay only if you
  love it" model — all three already exist as patterns, use them as the
  template for new offers rather than inventing a "pay first" pattern.
- **Use social proof from real customers only.** Never simulate review
  counts, star ratings, or client logos that aren't real and currently
  live.
- **Make ownership clear.** State plainly, on every relevant page, that
  the domain and files belong to the customer (§10) — this is already
  Forge's most consistent policy; don't let the rebuild weaken it.
- **Give the visitor control.** Let the customer decide the pace — e.g.
  the ₹5,000 flow's live walkthrough call where the customer chooses on
  the spot whether to proceed, rather than a hard sales close.
- **Use progressive commitment.** Free audit → free preview → small
  deposit → balance on delivery is a legitimate escalating-commitment
  ladder already present in the code; preserve the shape of it even
  where the specific numbers are still TBD.

**Hard rules — explicitly prohibited, no exceptions:**
- Do not use deceptive scarcity. If a cap isn't real and enforced, don't
  display it as a cap.
- Do not fabricate urgency, including countdown timers.
- Do not fabricate testimonials, under any framing.
- Do not fabricate metrics (conversion numbers, review counts, client
  counts) that cannot be traced to a real, current source.
- Do not imply guaranteed sales, leads, rankings, or revenue outcomes —
  this is already a written term (`terms.html` §"What we do not
  promise") and must not be contradicted by marketing copy.
- Do not pressure users with misleading countdowns or fake
  low-inventory framing.

---

## HUMAN DECISIONS REQUIRED

Every item below needs the business owner, not engineering judgment,
because the codebase either contains conflicting answers or no answer at
all.

1. **Canonical funnel** — is the `index.html` structure (₹9,999 →
   ₹24,999) or the `5000-setup.html` ladder (₹5,000 → ₹15,000 →
   ₹30,000) the one going into the rebuild, or does Forge intend to run
   both as separate acquisition channels on purpose? (§6, §7, §8, §11,
   §12)
   **Resolved 2026-09-06, directly by the business owner** (see
   `docs/decisions.md` ADR-011): the canonical commercial ladder is
   ₹5,000 (Launch) → ₹15,000 (Growth) → ₹25,000 (Pro), with Maintenance
   as the post-purchase upgrade. This supersedes both legacy funnels
   named above and the 2026-09-05 working assumption. Scope for each
   tier is set out in `lib/constants.ts` `WEBSITE_TIERS` and rendered at
   `/websites`, `/websites/5000`, `/websites/15000`, `/websites/25000`.
2. **The ₹25,000 figure named in the original brief** doesn't exist in
   the code at any price point — clarify whether it means the ₹24,999
   tier, the ₹30,000 tier, or a new tier to be defined. (§8)
   **Resolved 2026-09-06, directly by the business owner** (see
   `docs/decisions.md` ADR-011): it is a new tier, "Pro," positioned as
   Forge's premium/custom offering — not a relabeling of ₹24,999 or
   ₹30,000. Full scope in `lib/constants.ts` `WEBSITE_TIERS['25000']`
   and `/websites/25000`.
3. **Maintenance/Operator pricing** — three tiers at ₹1,499/₹3,999/₹7,999
   (`operator.html`) vs. a flat ₹1,999/mo (`5000-setup.html`): pick one
   structure. (§9)
4. **Revision policy across tiers** — is zero revisions (₹5,000 tier) an
   intentional cheaper offer, or should every paid tier include at least
   one revision? (§12)
5. **Refund policy for non-"50/50" payment structures** — the only
   written refund policy assumes a 50% deposit / 50% final split; the
   ₹5,000 tier (pay-after-approval) and the bespoke calculator's
   three-part split (₹2,499 / 50% / balance) have no matching refund
   clause. (§13)
6. **Whether to build a referral program**, and if so, its mechanics —
   nothing currently exists to base a decision on. (§14)
7. **Testimonial consent and usage policy** — Forge has a strong
   anti-fabrication stance but no process for ethically collecting and
   publishing a real testimonial once given. (§15)
8. **Showcase/case-study consent** — confirm the three clients currently
   named and linked on `5000-setup.html` explicitly agreed to be
   showcased with those details, and decide the policy for showcasing
   future clients (approval process, metric verification, promotion to
   the main funnel). (§16)
9. **Privacy policy accuracy** — `privacy.html` currently misstates who
   data is shared with (omits Supabase and GitHub) and claims no lead
   scoring happens when `priority_score` is in fact computed and stored.
   This needs an explicit decision: rewrite the policy to match the
   code, or change the code to match the policy. This is not optional —
   it's a live discrepancy between a public legal document and actual
   behavior. (§19)
10. **Data retention enforcement** — confirm whether the stated 90-day/
    12-month deletion windows are enforced anywhere (outside this repo,
    e.g. in Supabase config) or need to be built. (§19)
11. **CRM strategy** — decide whether Supabase is the CRM, feeds an
    external CRM, or the rebuild should implement pipeline stages
    (new/contacted/won/lost) that don't exist today. (§20)
12. **Analytics decision** — decide whether Forge wants any
    analytics/tracking at all, and if so, design an event taxonomy that
    is explicitly reconciled with the existing "no third-party trackers"
    privacy commitment rather than silently contradicting it. (§21)
13. **Canonical contact channel** — `hello@forge.local` (used in
    `index.html`, `audit.html`, `operator.html`, `thanks.html`,
    `privacy.html`, `terms.html`) is not a real, resolvable domain;
    `hello@forge.bruuhh.com` is used on the newer pages instead. Confirm
    the real support email and WhatsApp number before either is used
    live. (Carried over from the earlier architecture review; affects
    every section above that references contacting Forge.)
14. **Single positioning statement** — confirm the hero-copy positioning
    in §1 is still accurate before it's used as the anchor for rebuilt
    copy.
