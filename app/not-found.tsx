import type { Metadata } from 'next'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Link } from '@/components/ui/Link'

// No canonical URL applies to a catch-all 404 (the requested path is
// arbitrary), so this sets title/description/noindex directly rather
// than going through buildMetadata() — found rendering as a generic
// "Forge" tab title during pre-launch QA, 2026-09-06.
export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page does not exist.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <Heading as="h1" size="heading-md" className="mb-3">
        Page not found
      </Heading>
      <Text className="mb-6">The page you&rsquo;re looking for doesn&rsquo;t exist.</Text>
      <Link href="/">Back to home</Link>
    </div>
  )
}
