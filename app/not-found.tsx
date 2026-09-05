import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="mb-3 text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mb-6 text-muted">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <Link href="/" className="underline underline-offset-4 hover:text-ground">
        Back to home
      </Link>
    </div>
  )
}
