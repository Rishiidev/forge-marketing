import { buildMetadata } from '@/lib/seo'
import { NAV_LINKS } from '@/lib/constants'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Link } from '@/components/ui/Link'

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
      <Text as="span" size="caption" className="mb-2 block">
        Placeholder
      </Text>
      <Heading as="h1" size="heading-md" className="mb-4">
        Homepage — not built yet
      </Heading>
      <Text className="mb-8">
        Per the rebuild brief, the homepage is deliberately left unbuilt in this pass. The rest of the
        marketing site&rsquo;s architecture is wired up — use the links below, including the design
        system preview.
      </Text>
      <ul className="grid gap-2">
        {NAV_LINKS.filter((link) => link.href !== '/').map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
        <li>
          <Link href="/audit">Free audit</Link>
        </li>
        <li>
          <Link href="/design-system">Design system (internal)</Link>
        </li>
      </ul>
    </div>
  )
}
