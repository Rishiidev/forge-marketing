import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { SITE } from '@/lib/constants'

const FOOTER_LINKS = [
  { href: '/audit', label: 'Free audit' },
  { href: '/maintenance', label: 'Maintenance' },
  { href: '/showcases', label: 'Showcases' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper py-9">
      <Container className="flex flex-wrap items-center justify-between gap-5 text-[13px] text-muted">
        <span>
          © {SITE.name}. {SITE.tagline}
        </span>
        <div className="flex gap-5">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
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
