import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Minimal JSON-file-backed key-value store — not a database.
 *
 * Exists because of a verified, real limitation: Next.js compiles Route
 * Handlers (app/**\/route.ts) and Server Actions (app/actions.ts) into
 * separate bundles, each getting its own independent copy of any
 * module-level state. A plain `new Map()` at module scope is NOT
 * reliably shared between a Route Handler and a Server Action, even
 * within the same long-running `next start` process — confirmed
 * directly while building the referral system (docs/decisions.md
 * ADR-013): a referral code created via a Route Handler was invisible
 * to `attributeReferralLead()` running inside the Server Action that
 * creates leads, in the same running server.
 *
 * Reading/writing an actual file on disk sidesteps this entirely — the
 * filesystem is shared by every execution context in the same
 * process/container, regardless of which JS bundle is running. This is
 * still not a real database (no locking beyond whole-file
 * read-then-write, no concurrent-write safety, no query capability) —
 * adequate for this project's current scale (a single small Node
 * process, not a multi-instance production fleet) and consistent with
 * the "no real database" constraint already stated everywhere else in
 * this codebase (docs/architecture.md "Why no CMS"). A deployment that
 * outgrows this should replace these calls with a real database client
 * — same swap-later posture as every other piece of storage in this
 * project.
 */

const DATA_DIR = path.join(process.cwd(), '.data')

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readStore<T>(filename: string): Record<string, T> {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return {}
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return raw.trim() ? (JSON.parse(raw) as Record<string, T>) : {}
  } catch {
    return {}
  }
}

export function writeStore<T>(filename: string, data: Record<string, T>): void {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
