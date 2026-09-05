import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { NAV_LINKS, AUDIT_HREF, SITE } from '@/lib/constants'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <Container className="flex h-[68px] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold" aria-label={`${SITE.name} home`}>
          {SITE.name}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <Button href={AUDIT_HREF} size="md" className="text-[13px]">
          Get the free audit
        </Button>
      </Container>
    </header>
  )
}
