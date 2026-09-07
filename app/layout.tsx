import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { WhatsAppFloat } from '@/components/conversion/WhatsAppFloat'
import { SITE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { jsonLdScript } from '@/lib/seo'

// tailwind.config.ts has named Inter/Fraunces/JetBrains Mono as the brand
// type scale since the design system was built (ADR-005), but nothing
// ever actually loaded them — every page silently fell back to the
// browser's default system font the whole time. Found during a
// pre-launch performance/QA pass, 2026-09-06. next/font self-hosts these
// (built at compile time, no external request, automatic `font-display:
// swap` so text is never invisible while loading) — no CSP change
// needed despite next.config.mjs already allowlisting
// fonts.googleapis.com/fonts.gstatic.com for the older <link>-tag
// approach; that allowlist can stay (harmless) or be removed later, but
// isn't required by this.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.marketingUrl),
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.tagline,
}

/**
 * No dark theme exists — without an explicit color-scheme, some mobile
 * browsers (Chrome/Android's forced-dark heuristic in particular)
 * auto-darken the page and desaturate every custom paper/mark/ground
 * color into a muddy blue-gray wash. `colorScheme` lives on `viewport`,
 * not `metadata`, in the App Router — Next.js silently drops it if
 * it's placed on the wrong export.
 */
export const viewport: Viewport = {
  colorScheme: 'light',
}

/**
 * Site-wide Organization JSON-LD — the one entity every page on the site
 * shares, added once here rather than duplicated per-page (blog/showcase/
 * tool pages already emit their own more specific schema — BlogPosting,
 * CreativeWork, WebApplication — which reference this same organization
 * name/url, not a competing definition). Found missing entirely during
 * the 2026-09-07 SEO audit. `sameAs`/`contactPoint` are deliberately
 * omitted — SITE.supportEmail/whatsappNumber are still unresolved Human
 * Decisions (docs/forge-business-rules.md), and no real social profile
 * URLs exist yet; inventing either would violate this codebase's "never
 * fabricate a fact" convention.
 */
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.marketingUrl,
  logo: `${SITE.marketingUrl}/logo.png`,
  description: SITE.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, fraunces.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd) }}
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  )
}
