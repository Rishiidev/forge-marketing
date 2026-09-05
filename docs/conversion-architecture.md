# Forge — Conversion Architecture

This is the conversion-design source of truth for the rebuild, sitting
alongside `docs/forge-business-rules.md` (what Forge sells and on what
terms) and `docs/architecture.md` (how the site is built). Read this
before implementing the homepage or any conversion-critical page — it
exists precisely to be read first, per the brief that produced it.

**Working assumption this document adopts:** the brief that requested
this architecture states the primary funnel as
`Visitor → Free Audit → Qualified Lead → Sales Conversation → ₹5,000 Website`.
That's a real answer to `forge-business-rules.md` Human Decision #1
(canonical funnel) — at least for planning purposes — so this document
treats **₹5,000 as the canonical entry tier** and ₹15,000 / ₹25,000 /
Maintenance as **post-purchase upgrade tiers**, not parallel entry
points. A pointer noting this working assumption has been added to
`forge-business-rules.md` §6/HD#1; it still needs the business owner's
explicit confirmation before this stops being an assumption. Two other
open items this document depends on and cannot resolve itself:

- **Contact channel (HD#13):** every CTA below assumes WhatsApp-first
  contact, matching the existing pattern across the legacy codebase. The
  actual WhatsApp number and support email are still `null`/TBD in
  `lib/constants.ts`. Nothing here should be treated as ready to launch
  until that's filled in.
- **The exact ₹25,000 tier (HD#2):** treated here as a named upgrade
  step (matching `/websites/25000`'s existing "pending confirmation"
  state in the codebase), not as a fully specified product.

Nothing in this document invents a metric, testimonial, or guarantee.
Every evidence requirement below is a **requirement to obtain or build
real evidence**, not placeholder copy to ship.

---

## 1. Funnel overview

**Primary (revenue) funnel:**

```
Visitor → Free Audit → Qualified Lead → Sales Conversation → ₹5,000 Website
```

**Secondary funnel A — trust-first entry** (feeds the primary funnel at
its start, for visitors who aren't ready to hand over an email yet):

```
Visitor → View Showcase → Trust → Free Audit
```

**Secondary funnel B — advocacy loop** (runs after delivery, feeds new
visitors back into the primary funnel):

```
Customer → Review → Showcase → Referral
```

**Secondary funnel C — expansion** (runs after delivery, deepens revenue
per existing customer rather than acquiring a new one):

```
Customer → Performance → Upgrade → ₹15K / ₹25K / Maintenance
```

All four funnels share one CRM spine (§5) and one analytics taxonomy
(§7), so a lead or customer's progress through any of them is visible in
one place, not four disconnected trackers.

---

## 2. Conversion map

For every major section, in the order a visitor actually encounters
them. Homepage is broken into its constituent sections since it's the
primary conversion surface and the thing this document exists to inform
— see `app/page.tsx`, currently an explicit placeholder per
`docs/architecture.md`.

### Homepage — Hero

| | |
|---|---|
| **Goal** | Establish relevance in 3 seconds; earn the scroll. |
| **Customer question** | "Is this for a business like mine?" |
| **Psychological barrier** | Generic-agency skepticism — looks like every other "we build websites" page. |
| **Evidence needed** | A concrete mechanism (GBP → website, not "we design websites"), stated in the visitor's own vocabulary. Real specificity: 45 minutes, ₹5,000, from your Google Business Profile — not "fast" and "affordable." |
| **CTA** | Primary: start the free audit. |
| **Next step** | Scroll to Problem section, or click through to `/audit`. |

### Homepage — Problem ("the wound")

| | |
|---|---|
| **Goal** | Make the cost of inaction concrete without shame copy. |
| **Customer question** | "Is this actually costing me anything?" |
| **Psychological barrier** | "My Google listing is enough" — the customer doesn't feel a gap because they've never seen the alternative. |
| **Evidence needed** | A real before/after comparison using the visitor's *own* GBP data if technically feasible (legacy pattern), or a generic-but-honest side-by-side otherwise. No invented "you're losing ₹X/day" claims — explicitly prohibited (`forge-business-rules.md` §18). |
| **CTA** | Secondary: "See the difference" (scroll/anchor, not a form). |
| **Next step** | Trust/Proof section. |

### Homepage — Trust / Proof

| | |
|---|---|
| **Goal** | Answer "can I trust Forge?" before asking for anything. |
| **Customer question** | "Has Forge actually done this for a real business?" |
| **Psychological barrier** | Zero social proof currently exists in the main funnel — the only real showcase content lives on `5000-setup.html`, not `index.html` (`forge-business-rules.md` §16). |
| **Evidence needed** | Real, named, consented showcase examples (the three real client sites, contingent on the consent question in HD#8) plus the honest process facts: real domain-in-your-name policy, real 14-day support window, real capacity cap. No review counts or star ratings until real reviews exist. |
| **CTA** | Secondary: "See real websites we've built" → `/showcases`. |
| **Next step** | Process section, or directly to `/showcases`. |

### Homepage — How it works (process)

| | |
|---|---|
| **Goal** | Make the ask feel small and the timeline concrete. |
| **Customer question** | "Will this be a lot of work for me?" |
| **Psychological barrier** | Past bad experiences with "website guys" — expects a drawn-out project. |
| **Evidence needed** | The real numbered steps with real time estimates (send link ~2 min → we build ~30 min → you review on a call ~10 min → handover by tomorrow — `forge-business-rules.md` §11). Visible process, not "we'll be in touch." |
| **CTA** | Primary: start the free audit. |
| **Next step** | Offer section. |

### Homepage — Offer (pricing teaser)

| | |
|---|---|
| **Goal** | Make the entry price feel low-risk, not cheap-and-suspicious. |
| **Customer question** | "₹5,000 could still be a waste — what if I don't like it?" |
| **Psychological barrier** | Fear of paying for nothing; fear that "cheap" means "low quality." |
| **Evidence needed** | The real payment structure: **you see the live site and do a walkthrough call before paying anything** (`5000-setup.html`'s actual model). This single fact does most of the risk-reduction work — lead with it, don't bury it in an FAQ. |
| **CTA** | Primary: start the free audit (audit, not direct purchase — see §"low-friction first step" below). |
| **Next step** | `/websites` for full tier detail, or FAQ. |

### Homepage — FAQ

| | |
|---|---|
| **Goal** | Retire the remaining named objections (§3) before the final CTA. |
| **Customer question** | Varies — see §3. |
| **Psychological barrier** | Unaddressed doubt that would otherwise cause silent drop-off at the final CTA. |
| **Evidence needed** | Direct, specific answers — no deflection. Real accordion content, not a generic "contact us for details." |
| **CTA** | None (informational); final CTA follows. |
| **Next step** | Final CTA section. |

### Homepage — Final CTA

| | |
|---|---|
| **Goal** | Convert an already-warmed visitor. |
| **Customer question** | "Why should I do this right now instead of later?" |
| **Psychological barrier** | Default inertia — no real reason to act today. |
| **Evidence needed** | The real, enforced monthly capacity cap (`CAPACITY` in `lib/constants.ts`) if and only if it is genuinely live and enforced. If the cap isn't real for this launch, **do not display urgency here at all** — better no urgency than fake urgency. |
| **CTA** | Primary: start the free audit. |
| **Next step** | `/audit`. |

### `/audit`

| | |
|---|---|
| **Goal** | Complete the lowest-commitment step in the funnel. |
| **Customer question** | "What exactly am I giving up by trying this?" |
| **Psychological barrier** | Form fatigue; fear of a sales trap disguised as a "free" offer. |
| **Evidence needed** | The explicit no-upsell-inside-the-audit promise, the exact 7 points being reviewed, and the exact field list (already minimal — name, email, business, category, GBP link, optional WhatsApp). |
| **CTA** | Primary: submit the audit form. |
| **Next step** | `thanks`-style confirmation → CRM stage `Audit Lead` (§5). |

### `/websites` (tier comparison)

| | |
|---|---|
| **Goal** | Let a warmer visitor (post-audit, or self-directed) understand the full ladder without a sales call. |
| **Customer question** | "What exactly am I buying, and what happens if I want more later?" |
| **Psychological barrier** | Fear of hidden costs or a bait-and-switch from ₹5,000 to something larger. |
| **Evidence needed** | Transparent, side-by-side scope per tier (already the pattern in `WebsiteTierPage`/`PriceCard`) — what's included, what's explicitly excluded, real revision counts, real delivery times. |
| **CTA** | Primary: start the free audit (still the funnel entry, even from this page). |
| **Next step** | Individual tier page, or `/audit`. |

### `/websites/5000` (entry tier)

| | |
|---|---|
| **Goal** | Remove the last friction before a sales conversation. |
| **Customer question** | "Will the website actually look good for *my* type of business?" |
| **Psychological barrier** | Template anxiety — "cheap and fast" implies "generic." |
| **Evidence needed** | Named industry templates (salon/clinic/café/service/studio/coach — `forge-icp-and-templates.md`) and, critically, "you see it live before paying" restated here, not just on the homepage. |
| **CTA** | Primary: start the free audit / "ask about this tier." |
| **Next step** | `/audit`, or direct WhatsApp contact once that channel exists. |

### `/websites/15000` and `/websites/25000` (upgrade tiers)

| | |
|---|---|
| **Goal** | Serve a narrower audience: qualified leads who need more than a template, and existing customers considering an upgrade (secondary funnel C). Not the cold-traffic entry point. |
| **Customer question** | "Is this a completely different product, or does my ₹5,000 site carry forward?" |
| **Psychological barrier** | Confusion about whether upgrading means starting over. |
| **Evidence needed** | An explicit statement of what carries forward (domain, content, GBP data) vs. what's rebuilt. `/websites/25000` must keep showing its current honest "pending confirmation" state (`WebsiteTierPage`) until HD#2 is resolved — do not backfill fake scope to make the page feel finished. |
| **CTA** | Primary: "ask about this tier" (not a direct-audit CTA — this traffic is warmer, route it to a conversation). |
| **Next step** | Sales conversation (CRM stage, §5), not a cold form. |

### `/showcases` and `/showcases/[slug]`

| | |
|---|---|
| **Goal** | Convert proof into trust into audit signups (secondary funnel A). |
| **Customer question** | "Can you actually build for my type of business?" |
| **Psychological barrier** | "Those examples don't look like my industry." |
| **Evidence needed** | Coverage across the named industry templates, real client names/cities/metrics with **confirmed consent** (HD#8) — not the three names currently on `5000-setup.html` copied over without that confirmation. |
| **CTA** | Primary: start the free audit. |
| **Next step** | `/audit`. |
| **Micro-conversion** | Filtering/browsing by industry — a real, valuable low-commitment interaction to track (`showcase_viewed`, §7) even before any form is touched. |

### `/maintenance`

| | |
|---|---|
| **Goal** | Convert delivered customers (secondary funnel C) — not cold visitors. |
| **Customer question** | "Will I get trapped in monthly fees?" |
| **Psychological barrier** | Subscription fatigue; fear of being locked in after a low-friction ₹5,000 purchase. |
| **Evidence needed** | The real cancel-anytime policy, the real 8-client cap, and — once HD#3 resolves the pricing-structure conflict — one single, unambiguous price ladder. Do not ship both the three-tier and the flat-rate numbers at once. |
| **CTA** | Primary: "Talk to Forge" (conversation, not self-serve signup — no payment processing exists per `docs/architecture.md` scope). |
| **Next step** | Sales conversation → CRM stage `Maintenance` (§5). |

---

## 3. Objection handling

| # | Objection | Primarily addressed | Approach |
|---|---|---|---|
| 1 | "I don't need a website." | Homepage Problem section | Reframe from "you need a website" (abstract) to "customers who search for you right now find a competitor instead" (concrete, specific mechanism) — never a fear-based "you're losing ₹X/day" claim. |
| 2 | "₹5,000 could still be a waste." | Homepage Offer, `/websites/5000` | Lead with the actual payment mechanic: you see the live site and do a walkthrough call before paying. Risk reduction through sequencing, not through a refund policy alone. |
| 3 | "Will the website look good?" | `/websites/5000`, `/showcases` | Named industry templates + real, consented showcase examples in the visitor's own category. Specificity over hype: name the template, don't just say "professional design." |
| 4 | "Will this be a lot of work?" | Homepage Process section | The real numbered, timed steps (~2 min / ~30 min / ~10 min / by tomorrow). Visible process is the direct answer to this objection. |
| 5 | "Will I own my website?" | Every pricing page, footer, FAQ | State plainly and repeatedly: domain registered in the customer's name, files transferred, Cloudflare/email accounts created under the customer's own login — this is Forge's most consistent, uncontested policy (`forge-business-rules.md` §10). Repeat it; don't bury it in Terms. |
| 6 | "Will I get trapped in monthly fees?" | `/maintenance`, homepage FAQ | State the cancel-anytime policy and that the ₹5,000/₹15,000/₹25,000 tiers are one-time purchases with maintenance as a fully separate, optional add-on — never bundle maintenance into the base price by default. |
| 7 | "Can I trust Forge?" | Homepage Trust section, `/showcases`, footer | Real, consented proof + transparent scope/exclusions on every tier + an honest capacity cap (real number, real enforcement) instead of manufactured urgency. Trust comes from what's verifiable, not from claimed credentials. |
| 8 | "What exactly am I buying?" | `/websites` comparison, tier pages | Explicit included/excluded lists per tier (already the `WebsiteTierPage` pattern) — never a vague feature list. |
| 9 | "What happens after purchase?" | `/audit` confirmation, tier pages | The real delivery timeline and the real 14-day bug-support window, stated as a specific, bounded commitment — not "ongoing support" (which reads as vague and also risks implying free maintenance). |
| 10 | "Can you actually build for my type of business?" | `/showcases`, homepage Trust section | Coverage across the six named industry templates (salon, clinic, café, studio, service, coach — `forge-icp-and-templates.md`) with a real example per category where one exists; an honest "not yet, but here's what we'd do" for gaps rather than implying universal coverage. |

---

## 4. Per-page CTA / trust architecture

| Page | Primary CTA | Secondary CTA | Micro-conversion | Trust signal |
|---|---|---|---|---|
| Homepage | Start the free audit | See real websites we've built (→ `/showcases`) | Scroll past the fold; open an FAQ item | Real capacity strip (if enforced); "domain stays in your name" line |
| `/audit` | Submit the audit form | — | Field-by-field form progress (analytics only, not shown as a progress bar the visitor must complete) | "No upsell inside the audit" statement |
| `/websites` | Start the free audit | Compare tiers (already-viewing) | Hover/expand a tier's included list | Explicit exclusions list (transparency itself is a trust signal) |
| `/websites/5000` | Start the free audit | Ask about this tier | View an example in this visitor's industry | "You see it live before you pay" |
| `/websites/15000` | Ask about this tier | See `/websites/25000` | View comparison to `5000` | What carries forward from a `5000` build |
| `/websites/25000` | Ask about this tier | See `/websites/15000` | — | Explicit "pending confirmation" badge — honesty about an unfinished offer is itself trust-building, more than a confident but hollow claim |
| `/maintenance` | Talk to Forge | Read what's included / not included | Expand the boundary (included vs. excluded) table | Cancel-anytime policy, 8-client cap |
| `/showcases` | Start the free audit | Filter by industry | View one showcase detail | Real client name + city + consented specific outcome |
| `/showcases/[slug]` | Start the free audit | Back to all showcases | — | The single, specific, sourced outcome for this client |
| `/blog` / `/blog/[slug]` | Start the free audit (end-of-post) | Browse other posts | Scroll depth / time on page | Byline/author credibility if applicable |
| `/tools` / `/tools/[slug]` | Start the free audit (once a real tool exists) | — | Tool interaction itself is the micro-conversion (`tool_used`, §7) | The tool's own output, if it produces something concrete |

---

## 5. CRM lead lifecycle

The stage list below is a **superset** of what `lib/crm.ts`'s current
`LeadStage` type covers (`'new' | 'contacted' | 'qualified' | 'proposal' |
'won' | 'lost'`, itself already noted there as "a forward-looking
addition... not a migration of existing behavior" — `docs/architecture.md`
§"Constraints carried forward"). This document specifies the full
lifecycle the business needs; extending the type and adding the
transition logic is implementation work for later, not done in this
pass.

| Stage | Definition | Entry trigger | Exit → next stage |
|---|---|---|---|
| **Anonymous** | A site visitor with no captured identity. | Any `page_view`. | Submits any form → **Tool User** (if interacting pre-form) or directly **Audit Lead**. |
| **Tool User** | Engaged with a free interactive tool or meaningfully deep content (e.g. a pricing calculator, once one exists — `lib/constants.ts` `TOOLS` is currently empty) without giving contact info. Still anonymous in the CRM sense — tracked by session, not identity. | Interacts with a tool, or views 2+ showcase/pricing pages in one session. | Submits the audit form → **Audit Lead**. Session ends without conversion → stays **Anonymous** for CRM purposes (no dead-end lead record is created for a non-converting visitor). |
| **Audit Lead** | Submitted the free audit form. First point of real identity capture. | `audit` form submission (`lib/crm.ts` `captureLead()`, `source: 'audit'`). | Forge reviews the submission → **Qualified** or dropped (spam/out-of-ICP; not tracked as a lost sale, just filtered). |
| **Qualified** | A human at Forge has confirmed this is a real, addressable local business matching the ICP (`forge-icp-and-templates.md`). Manual step, not automatic. | Internal review of an Audit Lead. | Forge reaches out → **Contacted**. |
| **Contacted** | Forge has made first outreach (WhatsApp/call) with the audit findings. | Outreach sent. | Customer engages in a real conversation about the offer → **Proposal / Offer**. No response after a defined follow-up window → stays **Contacted** (re-attempted) or is marked inactive, never silently deleted. |
| **Proposal / Offer** | A specific tier and price has been proposed (₹5,000 primary; ₹15,000/₹25,000 if the conversation reveals a bigger need). | Forge names a tier and price in conversation. | Customer agrees and pays/commits → **Customer**. Customer declines → stays **Proposal / Offer** as a dormant record (revisit later), not deleted. |
| **Customer** | Payment/commitment received for a website tier. | Payment confirmation (external — no payment processing is built into this codebase per `docs/architecture.md` scope; this is a manually or externally confirmed event). | Website is built and handed over → **Delivered**. |
| **Delivered** | Website is live, domain/files/accounts confirmed in the customer's name, 14-day bug-support window active or complete. | Handover complete. | After a decent interval → **Review Requested**. |
| **Review Requested** | Forge has asked the customer for a review. | Review ask sent (WhatsApp/email). | Customer leaves a review → **Showcase Candidate** (if the review/result is strong) or stays **Delivered** with a flag if no review comes in — never fabricate one in its place. |
| **Showcase Candidate** | A delivered customer with a strong enough result to be worth showcasing, pending their **explicit, separate consent** to be named publicly (HD#8 — consent is not implied by leaving a review). | Forge identifies a strong result and asks for showcase consent. | Consent given → published as a real showcase entry, customer flagged **Referral Partner**-eligible. Consent withheld → stays **Delivered**/**Review Requested**, never published anyway. |
| **Referral Partner** | Customer has referred, or agreed to refer, another business. | Customer shares a referral link/code (mechanism: HD#6 — a referral *program*'s incentive terms are still undecided; the CRM stage and a trackable referral code/link are the minimum viable architecture regardless of what incentive, if any, is attached). | A referred lead submits the audit form → attribute that new **Audit Lead** to this Referral Partner. |
| **Expansion Opportunity** | Signals suggest the customer might benefit from an upgrade — business growth, requests beyond the original scope, content going stale. | Internal flag, from either a support interaction or a scheduled check-in. | Forge proposes an upgrade → back into **Proposal / Offer** (for ₹15,000/₹25,000) or direct to **Maintenance**. |
| **Maintenance** | Customer has subscribed to an ongoing Operator/maintenance plan. | Maintenance plan payment/commitment confirmed. | Cancels → back to **Delivered** (still owns everything per the ownership policy — cancellation is never data loss for the customer). |

---

## 6. Minimum CRM fields

Collected progressively, matching the stage table above — never all at
once, and never more than the current stage needs. This is already the
pattern the existing `audit` form follows (`forge-business-rules.md`
§19: "the preview form collects only a GBP link + optional WhatsApp
number... no name, email, or phone required"); this table extends that
discipline through the rest of the lifecycle rather than abandoning it
once a lead becomes a customer.

| Field | First collected at | Why |
|---|---|---|
| `email` | Audit Lead | Required to deliver the audit write-up. |
| `name` | Audit Lead | Personalizes outreach; already asked on the existing form. |
| `business_name` | Audit Lead | Needed to review the actual GBP. |
| `category` | Audit Lead | Routes to the right industry template context. |
| `google_profile_url` | Audit Lead | The entire input the audit and eventual website are built from. |
| `whatsapp` (optional) | Audit Lead | Enables the WhatsApp-first contact pattern; explicitly optional, matching current forms. |
| `is_qualified` (internal flag) + `qualification_note` | Qualified | Internal only — never shown to the customer, never used for external scoring/enrichment (avoids repeating the `priority_score`-vs-privacy-policy contradiction flagged in `forge-business-rules.md` §19/HD#9). |
| `contacted_at`, `contact_channel` | Contacted | Minimum record of outreach for follow-up scheduling. |
| `proposed_tier`, `proposed_price` | Proposal / Offer | Derived from the conversation, not asked of the customer as a form field. |
| `tier_purchased`, `amount_paid`, `payment_confirmed_at` | Customer | Minimum transactional record. No card/payment-method data is ever stored here — that stays with whatever external payment method is used, per the "no payment processing" scope boundary. |
| `website_url`, `delivered_at`, `ownership_transfer_confirmed` (boolean) | Delivered | Confirms the ownership promise (§3, objection 5) was actually kept, not just claimed. |
| `review_requested_at` | Review Requested | Follow-up scheduling only. |
| `showcase_consent` (boolean, timestamped, separately from any review) | Showcase Candidate | Must be explicit and separate from a review — a customer can leave a review without agreeing to be publicly named (HD#8). |
| `referral_code` | Referral Partner | One code per customer; used to attribute new leads, not to store any new PII about the customer themselves. |
| `expansion_flag`, `expansion_reason` (internal) | Expansion Opportunity | Internal targeting note, never customer-facing copy. |
| `maintenance_plan`, `maintenance_started_at` | Maintenance | Minimum record of the active plan. |

**Explicitly not collected, at any stage, unless the business later
decides otherwise:** physical address, government ID, date of birth, or
any field not directly required by the current stage's function. This
mirrors `privacy.html`'s existing minimal-collection stance
(`forge-business-rules.md` §19) — the goal is to keep that stance true
going forward, including through the CRM extension proposed here.

---

## 7. Analytics events

**These are first-party events only**, fired through the existing
`lib/analytics.ts` `trackEvent()` abstraction — no third-party pixel or
tracker. This is a hard constraint, not a preference: `legacy/privacy.html`
makes a live public promise of "no third-party trackers," and
`forge-business-rules.md` HD#12 explicitly requires any analytics
decision to be reconciled with that promise, not bolted on separately.
Defining this taxonomy does not itself resolve HD#12 (whether to enable
any analytics provider at all) — it defines what *would* be measured,
through whatever provider is eventually approved, using the
already-provider-agnostic abstraction that exists.

**Naming note:** the brief's own examples use a mix of tenses
(`audit_started`, `lead_submitted`, `whatsapp_clicked`) that don't quite
match the current `lib/analytics.ts` `AnalyticsEvent` union
(`lead_form_view`, `whatsapp_click`, `pricing_tier_view`, etc.). This
table adopts the brief's naming as the standard going forward; renaming
the existing five events to match is implementation work for the
homepage/pricing-page build, not done in this pass.

| Event | Fires when | Properties | Funnel |
|---|---|---|---|
| `page_view` | Any page loads | `path` | Universal |
| `audit_started` | Visitor interacts with the first field of the audit form | `source_page` | Primary |
| `lead_submitted` | Any lead form (audit, waitlist, maintenance enquiry) is successfully submitted | `source`, `lead_id` | Primary / all |
| `audit_completed` | **Backend/CRM event** — Forge has finished and delivered the actual audit write-up (distinct from the form-submit event above; this one reflects Forge's delivery, not the visitor's action) | `lead_id` | Primary |
| `qualified` | **CRM event** — lead marked Qualified | `lead_id` | Primary |
| `contacted` | **CRM event** — first outreach sent | `lead_id`, `channel` | Primary |
| `purchase_started` | Customer proceeds from Proposal/Offer toward a confirmed purchase | `lead_id`, `tier` | Primary |
| `customer_created` | **CRM event** — payment/commitment confirmed | `lead_id`, `tier`, `amount` | Primary |
| `pricing_viewed` | `/websites` or any tier page loads | `tier` (if a specific tier page) | Primary / Secondary C |
| `website_cta_clicked` | Any "start the free audit" / "ask about this tier" CTA is clicked | `location` (which page/section) | Primary |
| `showcase_viewed` | `/showcases` or a showcase detail page loads | `slug` (if detail page) | Secondary A |
| `showcase_filtered` | Visitor filters the showcase grid by industry | `industry` | Secondary A |
| `contact_clicked` | Any generic contact link (email, contact page) is clicked | `location` | Universal |
| `whatsapp_clicked` | The WhatsApp float or any WhatsApp CTA is clicked | `location` | Universal |
| `review_requested` | **CRM event** — review ask sent to a delivered customer | `lead_id` | Secondary B |
| `review_submitted` | A real review is received (once a collection mechanism exists) | `lead_id` | Secondary B |
| `showcase_consent_given` | **CRM event** — customer explicitly consents to be showcased | `lead_id` | Secondary B |
| `referral_link_generated` | **CRM event** — a referral code/link is created for a customer | `lead_id`, `referral_code` | Secondary B |
| `referral_clicked` | Someone clicks a shared referral link | `referral_code` | Secondary B |
| `maintenance_plan_viewed` | `/maintenance` loads | — | Secondary C |
| `expansion_flagged` | **CRM event** — an existing customer flagged for possible upgrade | `lead_id`, `reason` | Secondary C |
| `maintenance_started` | **CRM event** — maintenance plan commitment confirmed | `lead_id`, `plan` | Secondary C |
| `tool_used` | Visitor completes an interaction with a real tool (once one exists) | `tool_slug` | Secondary A / Tool User stage |
| `blog_viewed` | A blog post loads | `slug` | Content |

Events marked **CRM event** are backend/lifecycle-triggered (fired when
a human or system changes a lead's stage), not client-side page-tracking
calls — they belong in whatever server-side code eventually implements
the stage transitions in §5, calling `trackLeadEvent()` from
`lib/crm.ts`, not in page components calling `trackEvent()` from
`lib/analytics.ts`. The two abstractions stay separate, matching the
existing architecture (`docs/architecture.md`): analytics answers "what
did visitors do," CRM answers "what stage is this specific lead in."

---

## 8. Ethical guardrails checklist

Every mechanism proposed above was checked against the brief's required
principles and prohibitions. Restated here as a checklist so a future
implementer (or reviewer) can verify a specific page against it directly:

**Required, and where each shows up above:**
- **Specificity** — real numbers throughout (§2: 45 min build time, 14-day
  support, real tier inclusions) instead of "fast," "affordable," "great support."
- **Transparency** — explicit included/excluded lists per tier (§2, §4);
  the ₹25,000 tier's honest "pending confirmation" state is transparency
  applied to Forge's own incompleteness, not just to pricing.
- **Proof** — real, consented showcase examples only (§2 Trust section, §3
  objection 3/10); no showcase ships without the HD#8 consent step.
- **Risk reduction** — the "see it live before you pay" sequencing (§2
  Offer, §3 objection 2) does the real work here, not a refund policy
  layered on top of an upfront-payment model.
- **Low-friction first step** — the free audit, not a direct purchase or a
  "book a call," is the funnel's single entry point (§1, §2).
- **Progressive commitment** — audit → conversation → small tier purchase →
  optional upgrade/maintenance (§1); CRM fields collected progressively,
  never all at once (§6).
- **Clear ownership** — restated on every pricing surface, not buried in
  Terms (§3 objection 5, §4, §6 `ownership_transfer_confirmed` field).
- **Real customer evidence** — showcase and review mechanisms explicitly
  gated on real delivery and real consent (§5 stages, §7 events) — never
  simulated.
- **Visible process** — the numbered, timed steps on the homepage Process
  section (§2) and repeated on `/websites/5000`.
- **Controlled choice** — three clearly differentiated tiers plus an
  explicit "ask about this tier" path for anything non-standard (§2, §4),
  rather than a single forced offer.

**Prohibited, and how this document avoids each:**
- **Fake scarcity** — the capacity strip only appears where a real,
  enforced cap exists (§2 Final CTA); explicitly instructed to omit it
  entirely rather than fake it.
- **Fake countdowns** — none proposed anywhere in this document.
- **Fake social proof** — every review/testimonial/showcase mechanism in
  §5–§7 is gated on a real delivered customer and real consent; none is
  populated with placeholder content on a live page (the design-system
  preview's clearly-labeled "Example" content is explicitly excluded from
  ever appearing on a real page — see `docs/decisions.md` ADR-005).
- **Fabricated metrics** — `Metric`/`Testimonial`/`Review`/`CaseStudyCard`
  components already carry doc-comment warnings against this
  (`docs/decisions.md` ADR-005); this document's CRM/analytics design is
  what would eventually supply real numbers to them.
- **Dark patterns** — no pre-checked opt-ins, no confirm-shaming, no
  hidden opt-outs proposed anywhere above.
- **Hidden fees** — every tier page states inclusions/exclusions explicitly
  (§2, §3 objection 8); maintenance is explicitly a separate, optional
  purchase (§3 objection 6).
- **Misleading pricing** — one price per tier, stated plainly; the
  ₹25,000 tier stays visibly unconfirmed rather than shown as if final.
- **Guaranteed sales claims** — none proposed; `forge-business-rules.md`
  §18's existing prohibition (no guaranteed rankings/leads/revenue) is
  treated as binding on all new copy this document implies.

---

## Open items this document cannot resolve

Carried forward from `forge-business-rules.md` — implementation of the
above should not proceed past these without the business owner's input:

- **HD#13 (contact channel):** every WhatsApp-first CTA above is
  unusable until a real number is set.
- **HD#2 (₹25,000 tier):** its conversion-map row and CTA are
  intentionally provisional.
- **HD#3 (maintenance pricing):** §2's `/maintenance` row and §4's
  maintenance CTA can't be finalized against two conflicting price
  structures.
- **HD#6 (referral program terms):** §5 defines the *stage* and *tracking
  mechanism* for referrals; whether there's an incentive attached (and
  what it is) is a separate, unresolved business decision.
- **HD#8 (showcase/review consent process):** §5 and §6 assume an explicit
  consent step exists; the actual consent flow (what's asked, how it's
  recorded) still needs to be designed.
- **HD#12 (analytics decision):** §7 defines the taxonomy; whether any
  analytics provider is turned on at all is still open.
