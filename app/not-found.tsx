import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Link } from '@/components/ui/Link'

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
