import { getWebsiteTier, MAINTENANCE_PLANS } from './constants'

/**
 * Forge Free Audit — self-serve scoring engine.
 *
 * There is no live Google Business Profile API integration in this repo
 * (no credentials, no `.env` — docs/session-handoff.md). Per the brief for
 * this system: "if a live API integration is unavailable, design a
 * truthful fallback input flow." The fallback here is a 9-question,
 * self-report questionnaire — the visitor tells us what's true about
 * their own business, and every line of the result is a direct,
 * deterministic function of what they actually answered. Nothing about a
 * specific business is invented or looked up. See docs/decisions.md
 * ADR-009.
 *
 * Pure and side-effect free (no fetch, no env var, no randomness) and
 * deliberately client-safe — no `server-only` import — because the result
 * is computed instantly in the browser from the visitor's own answers,
 * not fetched from a backend. Do not add a secret or an API call here
 * without reconsidering that.
 */

export type AuditSignal = 'strong' | 'weak' | 'missing'

export interface AuditQuestionOption {
  value: string
  label: string
  signal: AuditSignal
}

export interface AuditCategoryDefinition {
  id: string
  label: string
  /** Fixed per category — the stakes don't change based on the answer. */
  whyItMatters: string
  prompt: string
  options: [AuditQuestionOption, AuditQuestionOption, AuditQuestionOption]
  /** Shown when the answer resolves to 'strong'. */
  good: string
  /** Shown when the answer resolves to 'weak' or 'missing'. */
  missingText: Record<'weak' | 'missing', string>
  whatToDoNext: Record<'weak' | 'missing', string>
}

export const AUDIT_CATEGORIES: AuditCategoryDefinition[] = [
  {
    id: 'business_information',
    label: 'Business information',
    whyItMatters:
      "This is the first thing Google shows a customer before they ever reach a website — wrong hours or a missing address costs you visits you never hear about.",
    prompt: 'Is your Google Business Profile fully filled in — correct name, category, hours, and address?',
    options: [
      { value: 'complete', label: 'Yes, everything is accurate and complete', signal: 'strong' },
      { value: 'partial', label: 'Mostly, but a few details are outdated or missing', signal: 'weak' },
      { value: 'unsure', label: 'Not sure, or a lot is missing', signal: 'missing' },
    ],
    good: 'Your Google Business Profile is complete and accurate — that’s the foundation everything else builds on.',
    missingText: {
      weak: 'Some details on your Google Business Profile are outdated or missing.',
      missing: 'Your Google Business Profile is incomplete, or you’re not sure what’s on it.',
    },
    whatToDoNext: {
      weak: 'Open your profile and fix anything outdated — hours, address, phone number. It takes a few minutes and stops customers reaching a closed door or a wrong number.',
      missing: 'Claim and fully fill in your Google Business Profile first — it’s free, and it’s what most customers see before anything else.',
    },
  },
  {
    id: 'website_presence',
    label: 'Website presence',
    whyItMatters: "A Google listing tells a customer you exist. A website tells them you're worth trusting enough to call.",
    prompt: 'Do you have a website right now?',
    options: [
      { value: 'current', label: "Yes, and it's been updated in the last year", signal: 'strong' },
      { value: 'stale', label: "Yes, but it's old or was never finished", signal: 'weak' },
      { value: 'none', label: 'No website at all', signal: 'missing' },
    ],
    good: 'You have a current website — customers who look you up find something real.',
    missingText: {
      weak: 'You have a website, but it’s old or unfinished — an outdated site can read as untrustworthy.',
      missing: "You don't have a website yet — customers searching for you find a listing, not a business.",
    },
    whatToDoNext: {
      weak: 'A refreshed, custom-built site fixes the trust gap an old page creates.',
      missing: 'This is the single highest-impact fix. A real website, live in under an hour, closes this gap completely.',
    },
  },
  {
    id: 'contactability',
    label: 'Contactability',
    whyItMatters: "Every extra tap between 'interested' and 'contacted' loses a customer who was ready to buy.",
    prompt: 'Can a customer call, WhatsApp, or message you in one tap from your website or Google profile?',
    options: [
      { value: 'everywhere', label: 'Yes, on every page', signal: 'strong' },
      { value: 'somewhere', label: 'Only in one place, or only a form', signal: 'weak' },
      { value: 'none', label: 'No direct contact option online', signal: 'missing' },
    ],
    good: 'Contacting you takes one tap, everywhere a customer looks — nothing standing between interest and a message.',
    missingText: {
      weak: "Contact options exist but aren't everywhere — a customer on the wrong page may not find them.",
      missing: "There's no direct way to call, WhatsApp, or message you online.",
    },
    whatToDoNext: {
      weak: 'Put a WhatsApp and Call button on every page, not just one.',
      missing: 'Add WhatsApp and Call buttons wherever your business shows up online — this alone recovers lost inquiries.',
    },
  },
  {
    id: 'reviews',
    label: 'Reviews',
    whyItMatters: 'New customers trust other customers more than they trust you — reviews are the proof that closes hesitation.',
    prompt: 'How would you describe your Google reviews?',
    options: [
      { value: 'strong', label: '50+ reviews, mostly 4★ and above', signal: 'strong' },
      { value: 'mixed', label: 'A handful of reviews, or a mixed rating', signal: 'weak' },
      { value: 'few', label: 'Few or no reviews', signal: 'missing' },
    ],
    good: 'Your review volume and rating already do a lot of the trust-building for you.',
    missingText: {
      weak: "Your reviews are thin or mixed — not enough yet to settle a hesitant customer.",
      missing: 'You have little to no review history for new customers to check.',
    },
    whatToDoNext: {
      weak: 'Ask your next 10 happy customers directly for a review — a short, specific ask works better than a generic one.',
      missing: 'Start asking every satisfied customer for a Google review — this compounds and costs nothing.',
    },
  },
  {
    id: 'service_clarity',
    label: 'Service clarity',
    whyItMatters: "A confused visitor doesn't ask questions, they leave — clarity is what keeps them on the page.",
    prompt: 'Can a visitor tell exactly what you offer, and roughly what it costs, in under 10 seconds?',
    options: [
      { value: 'clear', label: 'Yes, clearly listed', signal: 'strong' },
      { value: 'vague', label: 'Somewhat, it takes some digging', signal: 'weak' },
      { value: 'unclear', label: "No, services or pricing aren't listed anywhere", signal: 'missing' },
    ],
    good: "What you offer and what it costs is clear at a glance — visitors don't have to guess.",
    missingText: {
      weak: 'Your services are there, but a visitor has to dig for them.',
      missing: "There's no clear list of what you offer or what it costs, anywhere online.",
    },
    whatToDoNext: {
      weak: 'Move your services and rough pricing to the first thing a visitor sees.',
      missing: 'List exactly what you offer, and a rough price range, somewhere a visitor sees in the first few seconds.',
    },
  },
  {
    id: 'mobile_experience',
    label: 'Mobile experience',
    whyItMatters: "Most local searches happen on a phone — a site that fights the visitor on mobile loses them before they read a word.",
    prompt: 'Open your website on your own phone. Does it load fast and look right without pinching or zooming?',
    options: [
      { value: 'good', label: 'Yes', signal: 'strong' },
      { value: 'okay', label: "It's okay, but something feels off", signal: 'weak' },
      { value: 'bad', label: "No website, or it's broken/slow on mobile", signal: 'missing' },
    ],
    good: 'Your site works the way most of your customers actually browse — on their phone.',
    missingText: {
      weak: "Something about the mobile experience isn't quite right — worth a closer look.",
      missing: "Either there's no website, or it doesn't work properly on a phone — where most of your customers are searching from.",
    },
    whatToDoNext: {
      weak: 'Test the exact pages a customer lands on from Google, on your own phone, and fix whatever feels off.',
      missing: 'A mobile-first site fixes this from the ground up instead of patching an old one.',
    },
  },
  {
    id: 'online_credibility',
    label: 'Online credibility',
    whyItMatters: 'Real photos and proof answer the unspoken question every new customer has: is this actually a real, established business?',
    prompt: 'Do you have real photos, certifications, awards, or press mentions visible online?',
    options: [
      { value: 'several', label: 'Yes, several', signal: 'strong' },
      { value: 'few', label: 'One or two', signal: 'weak' },
      { value: 'none', label: 'None that I know of', signal: 'missing' },
    ],
    good: 'You have visible proof points online that back up your credibility.',
    missingText: {
      weak: "You have a little credibility proof online, but not much.",
      missing: "There's no visible proof online — photos, certifications, or press — that backs up your credibility.",
    },
    whatToDoNext: {
      weak: 'Add a few more real photos of your work, space, or team — small additions compound.',
      missing: 'Add real photos of your work and space to your Google profile and website first — the single easiest credibility fix.',
    },
  },
  {
    id: 'local_discoverability',
    label: 'Local discoverability',
    whyItMatters: "If you're not on the first page for your own category and city, the customer never reaches a decision about you at all.",
    prompt: 'Search your business category plus your city on Google. Do you appear on the first page?',
    options: [
      { value: 'top', label: 'Yes, near the top', signal: 'strong' },
      { value: 'low', label: 'Yes, but far down the page', signal: 'weak' },
      { value: 'no', label: "No, or I'm not sure", signal: 'missing' },
    ],
    good: 'You show up where customers are actually looking for your category in your city.',
    missingText: {
      weak: "You appear, but far enough down that most customers won't scroll to find you.",
      missing: "You don't appear on the first page for your own category and city, or you're not sure.",
    },
    whatToDoNext: {
      weak: 'A complete, optimized Google Business Profile and a real website both help you move up.',
      missing: 'Start with a complete Google Business Profile and a real website — the two things local search ranks on most.',
    },
  },
  {
    id: 'conversion_friction',
    label: 'Conversion friction',
    whyItMatters: 'Every extra step between finding you and reaching you is a chance for a ready customer to give up and pick someone else.',
    prompt: 'From finding you online, how many taps does it take a customer to actually call, message, or book?',
    options: [
      { value: 'one', label: 'One tap', signal: 'strong' },
      { value: 'few', label: 'A few taps, or they have to search for it', signal: 'weak' },
      { value: 'unclear', label: 'Not possible, or very unclear', signal: 'missing' },
    ],
    good: 'A ready customer can reach you in one tap — nothing lost to friction.',
    missingText: {
      weak: "It takes a few taps or some searching to actually reach you — some ready customers won't finish that.",
      missing: "It's unclear or not possible for a customer to reach you directly after finding you.",
    },
    whatToDoNext: {
      weak: 'Put your Call/WhatsApp button at the very top of the page, not buried below other content.',
      missing: 'Make calling or messaging you the single most obvious action on the page.',
    },
  },
]

/**
 * Priority order for "what would we fix first" — fixed and disclosed in
 * code, not tuned per visitor. Root-cause gaps (no website at all) always
 * outrank downstream ones, because fixing them also fixes several others
 * at once (a new Forge site includes WhatsApp/Call buttons, GBP linking,
 * mobile-first layout — see lib/constants.ts WEBSITE_TIERS['5000'].included).
 */
const PRIORITY_ORDER = [
  'website_presence',
  'contactability',
  'reviews',
  'mobile_experience',
  'local_discoverability',
  'service_clarity',
  'business_information',
  'online_credibility',
  'conversion_friction',
]

export interface AuditInput {
  businessName: string
  googleProfileUrl: string
  industry?: string
  location?: string
  /** categoryId -> selected option value */
  answers: Record<string, string>
}

export interface AuditCategoryResult {
  id: string
  label: string
  signal: AuditSignal
  whyItMatters: string
  statement: string
  whatToDoNext?: string
}

export interface AuditRecommendation {
  /** The category that triggered this recommendation, or null when every category is strong. */
  categoryId: string | null
  headline: string
  description: string
  ctaHref: string
  ctaLabel: string
}

export interface AuditResult {
  businessName: string
  googleProfileUrl: string
  categories: AuditCategoryResult[]
  counts: { strong: number; weak: number; missing: number }
  recommendation: AuditRecommendation
}

function resolveSignal(category: AuditCategoryDefinition, answerValue: string | undefined): AuditSignal {
  const option = category.options.find((o) => o.value === answerValue)
  // No answer on record for this category is itself a "missing" fact, not
  // a fabricated one — never defaulted to 'strong'.
  return option?.signal ?? 'missing'
}

function buildRecommendation(
  categories: AuditCategoryResult[],
  businessName: string
): AuditRecommendation {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const websitePresence = byId.get('website_presence')
  const topGap = PRIORITY_ORDER.map((id) => byId.get(id)).find((c) => c && c.signal !== 'strong')

  if (!topGap) {
    const forged = MAINTENANCE_PLANS.find((p) => p.id === 'forged')
    return {
      categoryId: null,
      headline: "You're in strong shape. Here's how to keep it that way.",
      description: `${businessName} is doing the fundamentals well — the highest-leverage next step is keeping it that way with a quarterly re-review and quick fixes before small gaps grow.${
        forged ? ` Forge's Forged plan (${forged.priceLabel}) includes that ongoing check.` : ''
      }`,
      ctaHref: '/maintenance',
      ctaLabel: 'See maintenance plans',
    }
  }

  if (websitePresence?.signal === 'missing') {
    const launch = getWebsiteTier('5000')
    return {
      categoryId: 'website_presence',
      headline: "Here's what we'd fix first: get a real website live.",
      description: `${businessName} doesn't have a website customers can find yet — everything else on this audit is downstream of that.${
        launch ? ` Forge builds one from your Google Business Profile, live in about 45 minutes, for ${launch.priceLabel} — you only pay after you see it.` : ''
      }`,
      ctaHref: '/websites/5000',
      ctaLabel: launch ? `See the ${launch.priceLabel} website` : 'See the Launch website',
    }
  }

  const growth = getWebsiteTier('15000')
  return {
    categoryId: topGap.id,
    headline: `Here's what we'd fix first: ${topGap.label.toLowerCase()}.`,
    description: `${topGap.whatToDoNext ?? topGap.statement}${
      growth ? ` Forge's ${growth.name} tier (${growth.priceLabel}) rebuilds your site around fixes like this one, not just a template.` : ''
    }`,
    ctaHref: '/websites/15000',
    ctaLabel: growth ? `See the ${growth.priceLabel} website` : 'See the Growth website',
  }
}

/**
 * Pure function: same input always produces the same output. This is the
 * guarantee behind "do not deliberately make the score artificially poor
 * to sell Forge" — there is no hidden weighting, no random variance, and
 * no branch conditioned on anything other than the visitor's own answers.
 */
export function computeAuditResult(input: AuditInput): AuditResult {
  const categories: AuditCategoryResult[] = AUDIT_CATEGORIES.map((category) => {
    const signal = resolveSignal(category, input.answers[category.id])
    return {
      id: category.id,
      label: category.label,
      signal,
      whyItMatters: category.whyItMatters,
      statement: signal === 'strong' ? category.good : category.missingText[signal],
      whatToDoNext: signal === 'strong' ? undefined : category.whatToDoNext[signal],
    }
  })

  const counts = categories.reduce(
    (acc, c) => {
      acc[c.signal] += 1
      return acc
    },
    { strong: 0, weak: 0, missing: 0 }
  )

  return {
    businessName: input.businessName,
    googleProfileUrl: input.googleProfileUrl,
    categories,
    counts,
    recommendation: buildRecommendation(categories, input.businessName || 'This business'),
  }
}
