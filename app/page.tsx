import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { NAV_LINKS } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Forge',
  description: 'The Forge marketing homepage is not built yet.',
  path: '/',
})

/**
 * INTENTIONALLY MINIMAL — "Do NOT build the homepage yet" was explicit in
 * the rebuild brief. This route exists only so the app has a working root
 * page for typecheck/lint/build and local navigation between the routes
 * that ARE built. Do not treat this as design or copy — it is a stub.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Placeholder</p>
      <h1 className="mb-4 text-3xl font-semibold text-ink">Homepage — not built yet</h1>
      <p className="mb-8 text-muted">
        Per the rebuild brief, the homepage is deliberately left unbuilt in this pass. The rest of the
        marketing site&rsquo;s architecture is wired up — use the links below.
      </p>
      <ul className="grid gap-2 text-ink">
        {NAV_LINKS.filter((link) => link.href !== '/').map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="underline underline-offset-4 hover:text-ground">
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/audit" className="underline underline-offset-4 hover:text-ground">
            Free audit
          </Link>
        </li>
      </ul>
    </div>
  )
}
