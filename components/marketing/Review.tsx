interface ReviewProps {
  rating: number
  text: string
  author: string
  source?: string
}

/**
 * A single star-rated review snippet (e.g. from Google). Display
 * primitive only — same rule as Testimonial: docs/forge-business-rules.md
 * §15/§18 prohibits fabricated reviews and review counts. Do not wire a
 * real number into this until real reviews exist to show.
 */
export function Review({ rating, text, author, source }: ReviewProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div aria-label={`${rating} out of 5 stars`} className="text-warm">
        {'★'.repeat(Math.round(rating))}
        <span className="text-muted-2">{'★'.repeat(5 - Math.round(rating))}</span>
      </div>
      <p className="mt-3 text-body-sm text-ink-3">{text}</p>
      <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-muted">
        {author}
        {source ? ` · ${source}` : ''}
      </p>
    </div>
  )
}
