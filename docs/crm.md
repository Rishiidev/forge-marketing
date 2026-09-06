# Forge — CRM Integration Architecture

Authoritative reference for `lib/crm.ts` — the CRM adapter, the Lead
model, and the full lifecycle. Where this document and
`docs/conversion-architecture.md` §5/§6 disagree, this document wins;
those sections now point back here (see the notes added at their top).

---

## 1. Why an adapter, not a vendor

The brief for this system was explicit: **the website must not be
tightly coupled to a single CRM provider.** Every call site in the app
(`app/actions.ts`) talks to six functions —
`createLead`, `updateLead`, `addLeadEvent`, `updateLeadStage`,
`addLeadTag`, `getLeadStatus` — exported from `lib/crm.ts`. None of them
know or care which of the following is actually receiving the data:

| Provider | Selected by | What it is |
|---|---|---|
| `console` (default) | No `CRM_PROVIDER` set — the state of this repo right now, no `.env` exists | A local JSON-file-backed store (`.data/leads.json`, `lib/file-store.ts`), logged to the server console. Nothing leaves the machine. Safe default for local dev and preview deploys. File-backed rather than a bare in-memory `Map` since docs/decisions.md ADR-013 — see that entry for why. |
| `webhook` | `CRM_PROVIDER=webhook` + `CRM_WEBHOOK_URL` | POSTs typed JSON envelopes to that URL. Works unmodified with Zapier, Make, n8n, a HubSpot forms-relay endpoint, or a small custom backend endpoint — the "lightweight backend endpoint" option named in the brief. |
| `hubspot` | `CRM_PROVIDER=hubspot` | A named stub. Every operation throws a clear, specific error. Exists to show the exact shape a real HubSpot adapter would take, not to pretend one exists. |

Switching providers, or adding a fourth, means writing one object that
implements `CrmAdapter` (below) and adding one branch to
`resolveProvider()` in `lib/crm.ts`. No page, component, or Server Action
changes.

**No credentials are invented anywhere in this codebase.** `CRM_WEBHOOK_URL`
and `CRM_WEBHOOK_SECRET` are env var *names* this code reads — neither has
a value set anywhere in this repo (no `.env` file exists; `.gitignore`
excludes `.env*`). Until a real value is supplied by whoever deploys
this, the app runs on the `console` provider automatically.

---

## 2. The adapter interface

```ts
// lib/crm.ts
export interface CrmAdapter {
  name: string
  createLead(input: CreateLeadInput): Promise<CreateLeadResult>
  updateLead(leadId: string, patch: LeadPatch): Promise<CrmOpResult>
  addLeadEvent(leadId: string, event: LeadEvent): Promise<CrmOpResult>
  updateLeadStage(leadId: string, stage: LeadStage): Promise<CrmOpResult>
  addLeadTag(leadId: string, tag: string): Promise<CrmOpResult>
  getLeadStatus(leadId: string): Promise<GetLeadStatusResult>
}
```

The six required operations, exactly as specified:

| Operation | Purpose |
|---|---|
| `createLead(input)` | Creates a Lead (or recognizes a duplicate — see §5) and returns its `leadId`. The only operation that doesn't require an existing lead. |
| `updateLead(leadId, patch)` | Merges new field values into an existing lead (e.g. a corrected email, a newly-learned industry). |
| `addLeadEvent(leadId, event)` | Records a meaningful, timestamped event against a lead (§6). |
| `updateLeadStage(leadId, stage)` | Moves a lead to a new point in the lifecycle (§4). |
| `addLeadTag(leadId, tag)` | Attaches a free-form label (e.g. `"referred-by:ABC123"`, `"high-intent"`). |
| `getLeadStatus(leadId)` | Reads back a lead's current stage and timestamps. No page calls this today — no admin/ops dashboard exists yet (out of scope per `docs/architecture.md`) — it exists so one can be built without touching this layer. |

Each of these is also exported as a **top-level function** with the same
name and signature (`export async function createLead(...)`, etc.) —
that's what the rest of the app actually imports. The top-level function
resolves the active provider, calls the adapter method, and — critically —
**never lets it throw** (§8).

---

## 3. Lead model

```ts
export interface Lead {
  leadId: string
  source: LeadSource
  campaign?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  landingPage?: string
  businessName?: string
  businessUrl?: string
  industry?: string
  location?: string
  contactName?: string
  email?: string
  phone?: string
  auditScore?: number
  auditStatus?: string
  tags?: string[]
  currentStage: LeadStage
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}
```

This matches the brief's field list exactly, with one addition:

- **`tags: string[]`** — not in the original field list, but
  `addLeadTag()` is a required operation and needs somewhere to persist
  what it adds. Append-only, deduplicated on write.

Field notes:

- **`businessUrl`** generalizes the audit tool's "Google Business Profile
  link" — a website or GBP URL, whichever the lead gave.
- **`industry`** is the same concept the rest of the app calls "category"
  (`lib/constants.ts` `CATEGORY_OPTIONS`) — renamed at the CRM boundary
  only; form field names (`category`) are unchanged so no form component
  needed editing.
- **`phone`** generalizes "whatsapp" — every current source treats
  WhatsApp number and phone number as the same value; form field names
  (`whatsapp`) are unchanged.
- **`auditScore`** (count of "strong" categories, 0–9) and
  **`auditStatus`** (the audit's top-priority category id, or `'strong'`)
  are **internal-only** — CRM/ops triage fields, never rendered to the
  visitor. The audit tool (`lib/audit.ts`, `docs/decisions.md` ADR-009)
  deliberately shows no bare score to the visitor; this doesn't
  contradict that, it's a separate, internal-facing number.
- **`campaign`** is a Forge-internal label (e.g. a named outreach batch),
  distinct from the raw `utmCampaign` query-param passthrough. Nothing
  sets it yet — reserved for when one is needed.
- Every field except `leadId`, `source`, `currentStage`, `createdAt`,
  `updatedAt`, `lastActivityAt` is optional, matching "do not collect
  unnecessary personal information": a lead can exist with only a
  `businessUrl` and a `phone`, nothing else.

`CreateLeadInput` is `Lead` minus the fields the system generates
(`leadId`, `tags`, `currentStage`, `createdAt`, `updatedAt`,
`lastActivityAt`), plus two inputs only `createLead()` accepts:
`initialStage` (defaults to `'audit-lead'` if omitted) and
`submissionId` (§5, idempotency).

---

## 4. Lifecycle

```ts
export type LeadStage =
  | 'anonymous'
  | 'tool-user'
  | 'audit-lead'
  | 'qualified'
  | 'contacted'
  | 'offer-presented'
  | 'customer'
  | 'website-in-production'
  | 'delivered'
  | 'review-requested'
  | 'review-received'
  | 'showcase-candidate'
  | 'showcase-published'
  | 'referral-partner'
  | 'expansion-opportunity'
  | 'maintenance-customer'
  | 'inactive'
```

| Stage | Meaning |
|---|---|
| **Anonymous** | A visitor with no captured identity. **Conceptual only** — see below. |
| **Tool User** | Engaged with a free tool (e.g. the audit) or deep content, still no identity. **Conceptual only.** |
| **Audit Lead** | First real identity capture — the default `initialStage` for every `createLead()` call today. |
| **Qualified** | A human confirmed this is a real, addressable business matching the ICP. |
| **Contacted** | First outreach sent. |
| **Offer Presented** | A specific tier/price has been proposed. |
| **Customer** | Payment/commitment received. |
| **Website In Production** | Build in progress, between purchase and launch. |
| **Delivered** | Live, domain/files/accounts confirmed in the customer's name. |
| **Review Requested** | Forge has asked for a review. |
| **Review Received** | A real review came back. |
| **Showcase Candidate** | Strong result, pending the customer's separate, explicit consent to be shown publicly (`forge-business-rules.md` HD#8 — consent is never implied by a review). |
| **Showcase Published** | Consent given and the entry is live on `/showcases`. |
| **Referral Partner** | Customer has referred, or agreed to refer, another business. |
| **Expansion Opportunity** | Signals suggest an upgrade fits (growth, scope creep, stale content). |
| **Maintenance Customer** | Subscribed to an ongoing Operator/maintenance plan. |
| **Inactive** | No response after a defined follow-up window, or explicitly churned. Never silently deleted — a record, not a removal. |

**"Anonymous" and "Tool User" are pre-CRM states, not stages a real Lead
record ever holds.** A visitor in either state has no captured identity —
they're tracked only by `lib/analytics.ts` (session, not identity),
matching the existing "no dead-end lead record for a non-converting
visitor" rule (`docs/conversion-architecture.md` §5, unchanged). Every
`createLead()` call in this codebase starts at `'audit-lead'` or later.
The two conceptual stages are still part of the `LeadStage` type — so a
future stage-transition diagram or admin tool can represent the whole
funnel, including the part that happens before a Lead record exists —
but no adapter method in this codebase ever sets a lead to either one.

**Wired today:** `app/actions.ts` `submitAuditLeadAction` calls
`createLead()` (which defaults to `'audit-lead'`). Every later stage
transition (`Qualified` onward) is a manual/internal action — no UI in
this codebase moves a lead through the rest of the lifecycle yet, same
as before this change. `updateLeadStage()` is fully implemented and
ready for that to be built against.

---

## 5. Data quality

**Malformed email/URL** — `lib/validation.ts` (`isValidEmail`,
`normalizeUrl`) is the one place this is checked, imported by both
Server Actions and the audit tool's client-side input form (so a visitor
sees the error before submitting, and the server checks again
independently — never trust client validation alone).

**Spam / bot submissions** — the honeypot pattern carried forward from
the legacy site (`components/forms/Honeypot.tsx`, a hidden `website`
field a real visitor never fills in) is checked first in every action;
a filled honeypot returns a fake success without ever calling the CRM.

**Rate limiting / abuse prevention** — `lib/rate-limit.ts`, an in-memory
fixed-window limiter (5 submissions per 10 minutes per client, keyed by
`x-forwarded-for`). See §9 "Known limitations" for what this doesn't
cover.

**Accidental duplicate submissions** (double-click, a slow network
causing a retry) — two layers:
1. `components/forms/SubmitButton.tsx` disables itself while pending —
   covers the common double-click case client-side.
2. Every lead form generates one **idempotency key**
   (`crypto.randomUUID()`, once per form mount — see
   `components/forms/useLeadForm.ts` and
   `components/audit/AuditLeadCaptureForm.tsx`) and sends it as
   `submissionId`. The `console` provider's `createLead()` recognizes a
   repeated `submissionId` and returns the existing lead instead of
   creating a new one.

**Duplicate leads (same person, different session)** — the `console`
provider also dedupes by normalized email within a 30-day window: a
second audit submission from the same email folds into the existing
lead (filling in anything new, bumping `lastActivityAt`) rather than
creating a second record. This is **not** a required adapter operation —
it's an internal implementation detail of `createLead()`, so the
adapter's public shape stays exactly the six operations specified. The
`webhook` provider cannot make this guarantee on its own (the receiving
system would need to dedupe on its end); the `submissionId` is always
included in the webhook payload so a downstream system that wants to
dedupe has what it needs to.

---

## 6. Events vs. analytics

Two related but distinct systems:

- **`lib/analytics.ts`** (`trackEvent()`) — client-side, covers the
  *entire* visitor journey, including anonymous/pre-identity visitors.
  Unchanged by this work.
- **`lib/crm.ts`** (`addLeadEvent()`) — server-side, requires a
  `leadId`, so it only applies from `'audit-lead'` onward.

```ts
export type LeadEventName =
  | 'audit_started'
  | 'audit_completed'
  | 'pricing_viewed'
  | 'pricing_plan_viewed'
  | 'showcase_viewed'
  | 'lead_submitted'
  | 'whatsapp_clicked'
  | 'call_clicked'
  | 'contact_clicked'
```

**Honestly wired today:** only `audit_completed` and `lead_submitted`
are actually called (`app/actions.ts` `submitAuditLeadAction`, right
after a successful `createLead()` — backfilling the fact that the audit
was completed, now that a `leadId` finally exists to attach it to). The
other seven names are fully typed and accepted by every provider, but
have no current call site: `pricing_viewed`, `showcase_viewed`,
`whatsapp_clicked`, `call_clicked`, and `contact_clicked` mostly happen
*before* any identity is known (a totally anonymous visitor browsing
`/websites` or clicking the global `WhatsAppFloat`) — there is no
`leadId` to attach them to yet. This is a real, stated architectural gap,
not silently-broken wiring: this codebase has no persistent per-visitor
lead identity (e.g. a `leadId` cookie) that would let an anonymous
session's later actions be attached to a lead retroactively. Building
that is a reasonable next step, not done here because it wasn't asked
for and would be a meaningfully different piece of infrastructure
(client-side identity persistence) than "a CRM adapter."

---

## 7. Security

- **No CRM credentials ever reach browser code.** `lib/crm.ts`,
  `lib/rate-limit.ts`, and `app/actions.ts` all run server-only —
  `lib/crm.ts` and `lib/rate-limit.ts` both start with `import
  'server-only'`, which fails the build if either is ever imported from
  a Client Component. `CRM_WEBHOOK_URL`/`CRM_WEBHOOK_SECRET` are read
  with `process.env` only inside these server-only files.
- **Webhook auth** — when `CRM_WEBHOOK_SECRET` is set, every webhook
  request carries `Authorization: Bearer <secret>`. Unset by default
  (no value exists in this repo); a webhook endpoint that needs auth
  simply won't get a valid request until a real secret is configured
  wherever this app is deployed (e.g. a platform's own env var UI, never
  committed to this repo).
- **Rate limiting** — see §5.
- **Honeypot** — see §5.

---

## 8. Graceful degradation

**The marketing site must not become unusable because the CRM is down.**
Concretely:

- Every top-level export (`createLead`, `updateLead`, `addLeadEvent`,
  `updateLeadStage`, `addLeadTag`, `getLeadStatus`) wraps its provider
  call in a `try/catch`. Whatever the provider does — the `hubspot` stub
  throwing on purpose, a real network failure, a bug in a future
  adapter — the caller always gets back a `{ ok: false, error }` value,
  never an unhandled rejection. A Server Action that lets an exception
  escape becomes a hard error page in Next.js; this is what prevents
  that.
- The error message returned to the *caller* is a generic, safe string
  (`"The CRM is temporarily unavailable. This does not affect the rest
  of the site."`) — the real error (`err.message`, a fetch failure
  reason, an HTTP status) is only ever logged server-side (§9), never
  shown to the visitor or leaked through the Server Action's return
  value.
- **The webhook provider has a hard 5-second timeout**
  (`AbortController`) on every request. Without this, a slow or
  unreachable CRM endpoint could hang a Server Action indefinitely,
  which — because the form's submit button stays disabled while
  pending — would make the *form* unusable even though the rest of the
  site is fine. The timeout bounds that to 5 seconds, after which the
  visitor sees the same graceful failure message as any other CRM
  outage.
- Every form on the site already renders a real error state on failure
  (`components/forms/FormStatus.tsx`) rather than silently doing
  nothing — a visitor who hits a CRM outage sees "something went wrong,
  try again," not a form that looks like it worked.

---

## 9. Observability

Every log line about a lead — success or failure — goes through
`safeLogFields()` (`lib/crm.ts`) or an equivalent inline shape, and
**never includes `email`, `phone`, `contactName`, `businessName`,
`businessUrl`, or `location`.** What's logged instead:

```
{ leadId, source, currentStage, hasEmail: boolean, hasPhone: boolean }
```

Failure logs additionally include the provider name and a short error
reason (`webhook responded 500`, `webhook timed out`, an `Error.message`
from an unexpected throw) — enough to debug an outage without writing a
visitor's personal data into server logs that likely outlive the
request and are outside this repo's control once emitted.

---

## 10. Configuration

No `.env` file exists in this repo (`.gitignore` excludes `.env*`) and
none is added by this work. To point this app at a real destination,
whoever deploys it sets:

| Env var | Effect |
|---|---|
| `CRM_PROVIDER` | `webhook` or `hubspot`. Unset (or anything else) → `console`. |
| `CRM_WEBHOOK_URL` | Required for `webhook`. If `CRM_PROVIDER=webhook` but this is unset, falls back to `console` with a warning logged — never silently drops leads by pointing at nothing. |
| `CRM_WEBHOOK_SECRET` | Optional. Adds a `Bearer` auth header to every webhook request. |

---

## 11. Known limitations

Stated plainly, matching this project's convention of marking a gap
rather than guessing past it:

- **The console provider's file-backed store (`lib/file-store.ts`) and
  the rate limiter are both single-machine.** The store survives a
  server restart (it's a real file, `.data/leads.json`) but not a
  redeploy that wipes the filesystem, and neither it nor the rate
  limiter shares state across multiple serverless instances or regions.
  Real production traffic behind multiple instances needs a shared store
  (e.g. Redis/Upstash, or a real database) — not added here because no
  credential for one was provided. Swappable later without changing any
  call site. (Earlier in this project, the console provider used a bare
  in-memory `Map` instead of a file — that turned out to be worse than
  this limitation, not just simpler: see ADR-013.)
- **`getLeadStatus()` on the `webhook` provider is best-effort.** A
  one-way webhook target (a typical Zapier/Make trigger) cannot answer a
  status query at all; this provider returns a clear error in that case
  rather than fabricating a status. A real vendor-specific adapter
  (e.g. an eventual HubSpot implementation) should implement this
  against that vendor's actual read API.
- **Referer-based attribution (`app/actions.ts`
  `deriveAttributionFromReferer`) is a fallback, not a guarantee.** It
  only covers the generic embedded form (`components/audit/AuditForm.tsx`),
  only works if the visitor hasn't navigated away from the UTM-tagged
  page before submitting, and some browsers/privacy modes omit the
  Referer header entirely. The audit tool's own dedicated capture form
  doesn't have this limitation — it reads `window.location` directly,
  client-side, at the moment of submission.
- **No persistent per-visitor lead identity.** See §6 — several defined
  events have no current call site because there's no `leadId` available
  before a lead is actually created.
- **HubSpot is a stub.** Selecting `CRM_PROVIDER=hubspot` fails loudly
  and specifically on every operation, by design (`docs/decisions.md`
  and `forge-business-rules.md` Human Decision #11 — which CRM, if any,
  is still an open business decision).
- **`tags` was added to the `Lead` model** beyond the brief's literal
  field list, because `addLeadTag()` — a required operation — needs
  somewhere to persist what it adds. Flagged here rather than silently
  extended.
