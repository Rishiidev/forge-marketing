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
  const destination = new URL('/audit', request.url)

  // resolveReferralCode()/recordReferralClick() read/write the file-backed
  // store (lib/file-store.ts) synchronously and can throw — e.g. a
  // read-only serverless filesystem, found live on Vercel during this
  // deployment's own QA pass (2026-09-06): the store's `.data/` directory
  // can't be created at runtime there, and this handler had no try/catch,
  // so a storage failure crashed the redirect with a 500. A storage error
  // gets the exact same outcome as an unrecognized code below — never a
  // dead end, per this route's own stated design.
  let resolved: { ok: boolean; referrerLeadId?: string }
  try {
    resolved = resolveReferralCode(code)
  } catch {
    return NextResponse.redirect(destination)
  }

  if (!resolved.ok) {
    return NextResponse.redirect(destination)
  }

  try {
    recordReferralClick(code)
  } catch {
    // Same reasoning — a failed click-count write shouldn't block the
    // redirect. Attribution below still proceeds; only the counter is lost.
  }
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
