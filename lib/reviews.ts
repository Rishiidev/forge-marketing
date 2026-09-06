import 'server-only'
import { readStore, writeStore } from './file-store'
import { updateLeadStage, getLeadStatus, type LeadStage } from './crm'

/**
 * Review + showcase-eligibility architecture — the SUCCESS → REVIEW →
 * SHOWCASE stretch of the post-sale growth loop. See
 * docs/architecture.md "Post-sale growth architecture" and
 * docs/decisions.md ADR-012.
 *
 * File-backed (lib/file-store.ts), not a bare in-memory Map — see
 * lib/referrals.ts's doc comment and docs/decisions.md ADR-013 for why:
 * a plain module-level Map is not reliably shared between a Route
 * Handler and a Server Action in Next.js, even in the same running
 * process. Still single-process/single-machine only — see docs/crm.md
 * "Known limitations."
 */

export type ReviewStatus = 'requested' | 'received' | 'approved' | 'declined'

/**
 * Three independent, explicit consents — never one blanket checkbox.
 * A customer can agree to appear on the Forge website but decline being
 * used in paid marketing material, or vice versa. Matches the existing
 * anti-fabrication rule that showcase consent is never implied by
 * leaving a review at all (forge-business-rules.md §16, HD#8; ADR-008).
 */
export interface ReviewConsent {
  website: boolean
  showcase: boolean
  marketing: boolean
}

export interface Review {
  reviewId: string
  leadId: string
  businessName?: string
  contactName?: string
  rating?: number
  quote?: string
  role?: string
  status: ReviewStatus
  consent: ReviewConsent
  requestedAt: string
  receivedAt?: string
  updatedAt: string
}

/**
 * Stages only reachable after a real delivery has happened. Used to
 * enforce "after successful delivery: request an honest review" and
 * "a customer can become a showcase candidate after successful
 * delivery" at the data layer, not just as a documented intention.
 */
const POST_DELIVERY_STAGES = new Set<LeadStage>([
  'delivered',
  'review-requested',
  'review-received',
  'showcase-candidate',
  'showcase-published',
  'referral-partner',
  'expansion-opportunity',
  'maintenance-customer',
])

const REVIEWS_FILE = 'reviews.json' // leadId -> Review

function generateReviewId(): string {
  return `REV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export interface RequestReviewResult {
  ok: boolean
  reviewId?: string
  error?: string
}

/**
 * "After successful delivery: request an honest review." Refuses before
 * the lead has actually reached a post-delivery stage — the ₹5,000
 * tier's whole point is a fast, low-friction delivery, but asking for a
 * review before that delivery happened would be asking for something
 * that isn't true yet.
 */
export async function requestReview(leadId: string, meta?: { businessName?: string; contactName?: string }): Promise<RequestReviewResult> {
  const status = await getLeadStatus(leadId)
  if (!status.ok || !status.status) return { ok: false, error: 'lead not found' }
  if (!POST_DELIVERY_STAGES.has(status.status.currentStage)) {
    return { ok: false, error: 'Reviews are requested after delivery, not before.' }
  }

  const reviews = readStore<Review>(REVIEWS_FILE)
  const existing = reviews[leadId]
  if (existing) return { ok: true, reviewId: existing.reviewId }

  const reviewId = generateReviewId()
  const timestamp = nowIso()
  reviews[leadId] = {
    reviewId,
    leadId,
    businessName: meta?.businessName,
    contactName: meta?.contactName,
    status: 'requested',
    consent: { website: false, showcase: false, marketing: false },
    requestedAt: timestamp,
    updatedAt: timestamp,
  }
  writeStore(REVIEWS_FILE, reviews)
  await updateLeadStage(leadId, 'review-requested')
  return { ok: true, reviewId }
}

export interface SubmitReviewInput {
  leadId: string
  quote: string
  rating?: number
  role?: string
  /** Each consent is opt-in; anything omitted defaults to false, never true. */
  consent: Partial<ReviewConsent>
}

export interface SubmitReviewResult {
  ok: boolean
  error?: string
}

/** The customer's honest review comes back through here — "an honest review," not a pre-written quote for them to approve. */
export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const reviews = readStore<Review>(REVIEWS_FILE)
  const review = reviews[input.leadId]
  if (!review) return { ok: false, error: 'no review was requested for this lead' }

  review.quote = input.quote
  review.rating = input.rating
  review.role = input.role
  review.consent = {
    website: input.consent.website ?? false,
    showcase: input.consent.showcase ?? false,
    marketing: input.consent.marketing ?? false,
  }
  review.status = 'received'
  review.receivedAt = nowIso()
  review.updatedAt = review.receivedAt
  writeStore(REVIEWS_FILE, reviews)

  await updateLeadStage(input.leadId, 'review-received')
  return { ok: true }
}

/**
 * Lets a customer change their mind later — grant or revoke any of the
 * three consents independently, without resubmitting the whole review.
 */
export async function updateReviewConsent(leadId: string, consent: Partial<ReviewConsent>): Promise<SubmitReviewResult> {
  const reviews = readStore<Review>(REVIEWS_FILE)
  const review = reviews[leadId]
  if (!review) return { ok: false, error: 'no review on file for this lead' }
  review.consent = { ...review.consent, ...consent }
  review.updatedAt = nowIso()
  writeStore(REVIEWS_FILE, reviews)
  return { ok: true }
}

export function getReview(leadId: string): Review | undefined {
  const reviews = readStore<Review>(REVIEWS_FILE)
  return reviews[leadId]
}

export interface ShowcaseEligibility {
  eligible: boolean
  reason?: string
}

/**
 * "A customer can become a showcase candidate after: successful
 * delivery, permission, appropriate review/proof." All three checked
 * independently — permission is never implied by delivery, and delivery
 * is never implied by having a review on file (someone could, in
 * principle, have a review record without this codebase's own delivery
 * step having run — this guards against that too).
 */
export async function checkShowcaseEligibility(leadId: string): Promise<ShowcaseEligibility> {
  const status = await getLeadStatus(leadId)
  if (!status.ok || !status.status) return { eligible: false, reason: 'lead not found' }
  if (!POST_DELIVERY_STAGES.has(status.status.currentStage)) {
    return { eligible: false, reason: 'not yet delivered' }
  }

  const reviews = readStore<Review>(REVIEWS_FILE)
  const review = reviews[leadId]
  if (!review || (review.status !== 'received' && review.status !== 'approved')) {
    return { eligible: false, reason: 'no review on file yet' }
  }
  if (!review.consent.showcase) {
    return { eligible: false, reason: 'customer has not given showcase consent' }
  }
  return { eligible: true }
}

export interface MarkShowcaseCandidateResult {
  ok: boolean
  error?: string
}

/**
 * Moves an eligible lead to 'showcase-candidate' in the CRM. This is
 * about who's *eligible to be asked* — it does not publish anything.
 * Actually publishing a showcase entry is still the existing, deliberate
 * manual step (a person writes the `.mdx` file — lib/showcases.ts,
 * ADR-008); this function has no knowledge of and does not touch
 * content/showcases/*.mdx. Once an entry is published, a person calls
 * updateLeadStage(leadId, 'showcase-published') directly, the same way
 * every other post-'audit-lead' stage transition in this codebase is
 * manual today (docs/crm.md §4).
 */
export async function markShowcaseCandidate(leadId: string): Promise<MarkShowcaseCandidateResult> {
  const eligibility = await checkShowcaseEligibility(leadId)
  if (!eligibility.eligible) return { ok: false, error: eligibility.reason }
  await updateLeadStage(leadId, 'showcase-candidate')
  return { ok: true }
}
