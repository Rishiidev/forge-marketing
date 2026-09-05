import type { Metadata } from 'next'
import './globals.css'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { WhatsAppFloat } from '@/components/conversion/WhatsAppFloat'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.marketingUrl),
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  )
}
