import { buildMetadata } from '@/lib/seo'
import { getWebsiteTier } from '@/lib/constants'
import { WebsiteTierPage } from '@/components/pricing/WebsiteTierPage'

const tier = getWebsiteTier('15000')!

export const metadata = buildMetadata({
  title: tier.name,
  description: tier.tagline,
  path: '/websites/15000',
})

export default function Page() {
  return <WebsiteTierPage slug="15000" />
}
