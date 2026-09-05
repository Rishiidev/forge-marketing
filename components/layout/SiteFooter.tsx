import { Container } from '@/components/ui/Container'
import { Link } from '@/components/ui/Link'
import { Text } from '@/components/ui/Text'
import { SITE } from '@/lib/constants'

const FOOTER_LINKS = [
  { href: '/audit', label: 'Free audit' },
  { href: '/maintenance', label: 'Maintenance' },
  { href: '/showcases', label: 'Showcases' },
]

/** The brief calls this "Footer"; kept the established SiteFooter name (docs/architecture.md) — same component. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-paper py-9">
      <Container className="flex flex-wrap items-center justify-between gap-5">
        <Text size="body-sm">
          © {SITE.name}. {SITE.tagline}
        </Text>
        <div className="flex gap-5">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} variant="quiet" className="text-body-sm">
              {link.label}
            </Link>
          ))}
          {/* TBD — support email is not confirmed. See lib/constants.ts SITE.supportEmail
              and docs/forge-business-rules.md Human Decision #13. No mailto link is
              rendered until a real address exists, to avoid shipping a dead contact
              method the way legacy/*.html did with hello@forge.local. */}
        </div>
      </Container>
    </footer>
  )
}
