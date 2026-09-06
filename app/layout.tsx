import type { Metadata } from 'next'
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { WhatsAppFloat } from '@/components/conversion/WhatsAppFloat'
import { SITE } from '@/lib/constants'
import { cn } from '@/lib/utils'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, fraunces.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  )
}
