import { NextRequest, NextResponse } from 'next/server'
import { recordReferralClick, resolveReferralCode } from '@/lib/referrals'

/**
 * Referral link: /r/[code]. Works today with no customer app or
 * dashboard — the code itself is created via lib/referrals.ts
 * (currently only callable internally; no UI generates one yet, by
 * design — see docs/architecture.md "Post-sale growth architecture").
 *
 * Always forwards to /audit — the actual funnel entry point — whether or
 * not the code is recognized. A mistyped or stale referral link should
 * never dead-end a visitor; it just arrives at the free audit without
 * attribution instead of with it.
 */

const REFERRAL_COOKIE = 'forge_ref'
const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days — matches lib/crm.ts's lead dedup window

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  const resolved = resolveReferralCode(code)

  const destination = new URL('/audit', request.url)

  if (!resolved.ok) {
    return NextResponse.redirect(destination)
  }

  recordReferralClick(code)
  const normalizedCode = code.trim().toUpperCase()
  destination.searchParams.set('ref', normalizedCode)

  const response = NextResponse.redirect(destination)
  response.cookies.set(REFERRAL_COOKIE, normalizedCode, {
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  })
  return response
}
