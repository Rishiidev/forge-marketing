'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { NAV_LINKS, AUDIT_HREF, SITE } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** The brief calls this "Navbar"; kept the established SiteHeader name (docs/architecture.md) — same component. */
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/90 backdrop-blur">
      <Container className="flex h-[68px] items-center justify-between gap-6">
        <Link
          href="/"
          className="focus-ring flex items-center gap-2 rounded-sm text-body font-bold text-ink"
          aria-label={`${SITE.name} home`}
        >
          {SITE.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-sm text-body-sm text-muted transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button href={AUDIT_HREF} size="md" className="hidden md:inline-flex">
            Get the free audit
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={cn(
                  'absolute left-0 top-0 h-[1.5px] w-4 bg-ink transition-transform duration-200 ease-forge',
                  mobileOpen && 'translate-y-[5px] rotate-45'
                )}
              />
              <span
                className={cn(
                  'absolute bottom-0 left-0 h-[1.5px] w-4 bg-ink transition-transform duration-200 ease-forge',
                  mobileOpen && '-translate-y-[5px] -rotate-45'
                )}
              />
            </span>
          </button>
        </div>
      </Container>

      <div
        id="mobile-nav"
        className="grid overflow-hidden border-b border-border bg-paper transition-[grid-template-rows] duration-300 ease-forge md:hidden"
        style={{ gridTemplateRows: mobileOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="focus-ring rounded-md px-2 py-2.5 text-body text-ink"
              >
                {link.label}
              </Link>
            ))}
            <Button href={AUDIT_HREF} size="md" className="mt-2 justify-center">
              Get the free audit
            </Button>
          </Container>
        </div>
      </div>
    </header>
  )
}
