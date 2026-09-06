import 'server-only'
import { readStore, writeStore } from './file-store'
import { SITE, REFERRAL_REWARD_CONFIG } from './constants'
import { updateLead, updateLeadStage, addLeadTag, addLeadEvent, getLeadStatus, type LeadStage } from './crm'

/**
 * Referral architecture — CUSTOMER → SUCCESS → REVIEW → SHOWCASE →
 * REFERRAL → NEW CUSTOMER. See docs/architecture.md "Post-sale growth
 * architecture" and docs/decisions.md ADR-012.
 *
 * The ₹5,000 website's delivery never depends on this file — nothing
 * here is called from, or gates, the website-purchase/delivery path.
 * This is purely a post-delivery growth mechanism a customer can
 * optionally participate in.
 *
 * File-backed (lib/file-store.ts), not a bare in-memory Map — a real
 * cross-boundary bug was found and fixed here (docs/decisions.md
 * ADR-013): referral codes are created via a Route Handler
 * (app/r/[code]/route.ts, or a future admin action) but attributed from
 * a Server Action (app/actions.ts); Next.js compiles those into separate
 * bundles that don't share plain module-level state, even in the same
 * running server. Still single-process/single-machine only — see
 * docs/crm.md "Known limitations." No database exists in this project;
 * see docs/architecture.md "Why no CMS" for the same reasoning applied
 * here. Swappable for a real store later without changing any call site
 * below.
 */

export type ReferralStatus = 'lead-created' | 'qualified' | 'converted'

/**
 * No reward model exists yet (REFERRAL_REWARD_CONFIG, HD#6). 'tbd' is
 * the honest default for every attribution until a real reward is
 * configured; 'pending' means "this referral qualified for whatever
 * reward gets configured, once one exists"; 'not-applicable' is reserved
 * for a future case where a specific referral is explicitly excluded
 * (e.g. self-referral, fraud) without deleting the record.
 */
export type RewardStatus = 'tbd' | 'pending' | 'not-applicable'

export interface ReferralCode {
  code: string
  referrerLeadId: string
  url: string
  createdAt: string
  clickCount: number
  referredLeadIds: string[]
}

export interface ReferralAttribution {
  code: string
  referrerLeadId: string
  referredLeadId: string
  status: ReferralStatus
  rewardStatus: RewardStatus
  attributedAt: string
  updatedAt: string
}

/**
 * A lead can only start referring once Forge has actually delivered
 * something to them — generating a code for an 'audit-lead' or a
 * 'contacted' prospect would invite someone to refer people to a
 * business that isn't even a customer yet.
 */
const CAN_REFER_STAGES = new Set<LeadStage>([
  'customer',
  'website-in-production',
  'delivered',
  'review-requested',
  'review-received',
  'showcase-candidate',
  'showcase-published',
  'referral-partner',
  'expansion-opportunity',
  'maintenance-customer',
])

const CODES_FILE = 'referral-codes.json' // code -> ReferralCode
const ATTRIBUTIONS_FILE = 'referral-attributions.json' // referredLeadId -> ReferralAttribution

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function nowIso(): string {
  return new Date().toISOString()
}

export interface CreateReferralCodeResult {
  ok: boolean
  code?: string
  url?: string
  error?: string
}

/**
 * Creates (or returns the existing) referral code/URL for a lead —
 * "unique referral identifier" + "referral URL". Idempotent: calling
 * this again for the same lead never issues a second code. Works today
 * with no customer dashboard — nothing in this codebase currently calls
 * it (no UI exists to trigger it, by design; see docs/architecture.md),
 * but it's what a future "your referral link" dashboard action, or a
 * manual ops action, would call.
 */
export async function createReferralCode(referrerLeadId: string): Promise<CreateReferralCodeResult> {
  const codes = readStore<ReferralCode>(CODES_FILE)

  const existing = Object.values(codes).find((c) => c.referrerLeadId === referrerLeadId)
  if (existing) return { ok: true, code: existing.code, url: existing.url }

  const status = await getLeadStatus(referrerLeadId)
  if (!status.ok || !status.status) {
    return { ok: false, error: 'lead not found' }
  }
  if (!CAN_REFER_STAGES.has(status.status.currentStage)) {
    return { ok: false, error: 'Referral codes are issued after delivery, not before.' }
  }

  let code = generateCode()
  while (codes[code]) code = generateCode() // defensive only — collision is ~1-in-60M per attempt
  const url = `${SITE.marketingUrl}/r/${code}`
  const record: ReferralCode = {
    code,
    referrerLeadId,
    url,
    createdAt: nowIso(),
    clickCount: 0,
    referredLeadIds: [],
  }
  codes[code] = record
  writeStore(CODES_FILE, codes)
  return { ok: true, code, url }
}

export interface ResolveReferralCodeResult {
  ok: boolean
  referrerLeadId?: string
}

/** Used by app/r/[code]/route.ts to decide whether an incoming code is real before redirecting. */
export function resolveReferralCode(code: string): ResolveReferralCodeResult {
  const codes = readStore<ReferralCode>(CODES_FILE)
  const record = codes[code.trim().toUpperCase()]
  return record ? { ok: true, referrerLeadId: record.referrerLeadId } : { ok: false }
}

/**
 * Records a `referral_click` — an anonymous visit to /r/[code], before
 * any lead exists. Tracked here (a plain counter) rather than through
 * addLeadEvent(), which requires a leadId that doesn't exist yet at this
 * moment — see the LeadEventName comment in lib/crm.ts.
 */
export function recordReferralClick(code: string): void {
  const codes = readStore<ReferralCode>(CODES_FILE)
  const key = code.trim().toUpperCase()
  const record = codes[key]
  if (!record) return
  record.clickCount += 1
  writeStore(CODES_FILE, codes)
  console.log('[referrals] referral_click', { code: record.code, clickCount: record.clickCount })
}

export interface AttributeReferralResult {
  ok: boolean
  error?: string
}

/**
 * "Referral attribution" — called once, when a referred visitor becomes
 * a real lead (app/actions.ts, right after a successful, non-deduped
 * createLead()). Records the attribution, tags the new lead with which
 * code brought them in, and fires `referral_lead` against that new
 * lead's own record (it has a leadId now).
 */
export async function attributeReferralLead(code: string, referredLeadId: string): Promise<AttributeReferralResult> {
  const codes = readStore<ReferralCode>(CODES_FILE)
  const key = code.trim().toUpperCase()
  const record = codes[key]
  if (!record) return { ok: false, error: 'unknown referral code' }
  if (record.referrerLeadId === referredLeadId) return { ok: false, error: 'a lead cannot refer itself' }

  const attributions = readStore<ReferralAttribution>(ATTRIBUTIONS_FILE)
  if (attributions[referredLeadId]) return { ok: true } // already attributed — idempotent

  if (!record.referredLeadIds.includes(referredLeadId)) record.referredLeadIds.push(referredLeadId)
  writeStore(CODES_FILE, codes)

  const timestamp = nowIso()
  attributions[referredLeadId] = {
    code: record.code,
    referrerLeadId: record.referrerLeadId,
    referredLeadId,
    status: 'lead-created',
    rewardStatus: 'tbd',
    attributedAt: timestamp,
    updatedAt: timestamp,
  }
  writeStore(ATTRIBUTIONS_FILE, attributions)

  await updateLead(referredLeadId, { referredByCode: record.code })
  await addLeadEvent(referredLeadId, { name: 'referral_lead', properties: { code: record.code } })
  console.log('[referrals] referral_lead', { code: record.code, referredLeadId })
  return { ok: true }
}

export interface MarkReferralConvertedResult {
  ok: boolean
  error?: string
}

/**
 * "Successful referral" — the referred lead became a paying customer.
 * No automatic trigger exists for this in the codebase today: there is
 * no payment processing (docs/architecture.md "Out of scope"), so
 * nothing can detect a real purchase on its own. This function is ready
 * for a future manual/ops action or a real purchase-confirmation step to
 * call — same status as updateLeadStage() itself, which nothing in the
 * UI calls automatically past 'audit-lead' either (docs/crm.md §4).
 *
 * Sets rewardStatus to 'pending' (not a promise of a specific reward —
 * REFERRAL_REWARD_CONFIG has no type/value configured yet; 'pending'
 * just means "this one qualifies, once a reward model exists").
 */
export async function markReferralConverted(referredLeadId: string): Promise<MarkReferralConvertedResult> {
  const attributions = readStore<ReferralAttribution>(ATTRIBUTIONS_FILE)
  const attribution = attributions[referredLeadId]
  if (!attribution) return { ok: false, error: 'no referral attribution for this lead' }

  attribution.status = 'converted'
  attribution.rewardStatus = REFERRAL_REWARD_CONFIG.status === 'confirmed' ? 'pending' : 'tbd'
  attribution.updatedAt = nowIso()
  writeStore(ATTRIBUTIONS_FILE, attributions)

  await addLeadEvent(referredLeadId, { name: 'referral_conversion', properties: { code: attribution.code } })
  await addLeadTag(attribution.referrerLeadId, 'referral-partner')
  await updateLeadStage(attribution.referrerLeadId, 'referral-partner')
  console.log('[referrals] referral_conversion', { code: attribution.code, referredLeadId })
  return { ok: true }
}

export interface ReferralStatusSummary {
  code: string
  clickCount: number
  referredLeadIds: string[]
  attributions: ReferralAttribution[]
}

export interface GetReferralStatusResult {
  ok: boolean
  summary?: ReferralStatusSummary
  error?: string
}

/**
 * Read-only summary of one referral code — "referral status" +
 * "reward status" for every lead it brought in. No page calls this
 * today (no dashboard exists yet, by explicit instruction); it's the
 * data a future customer-facing "your referrals" view would read.
 */
export function getReferralStatus(code: string): GetReferralStatusResult {
  const codes = readStore<ReferralCode>(CODES_FILE)
  const record = codes[code.trim().toUpperCase()]
  if (!record) return { ok: false, error: 'unknown referral code' }
  const attributions = readStore<ReferralAttribution>(ATTRIBUTIONS_FILE)
  const relevantAttributions = record.referredLeadIds.map((id) => attributions[id]).filter((a): a is ReferralAttribution => Boolean(a))
  return {
    ok: true,
    summary: {
      code: record.code,
      clickCount: record.clickCount,
      referredLeadIds: record.referredLeadIds,
      attributions: relevantAttributions,
    },
  }
}
