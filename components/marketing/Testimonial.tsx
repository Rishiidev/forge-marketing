interface TestimonialProps {
  quote: string
  name: string
  role: string
}

/**
 * A single customer quote. Display primitive only — see
 * docs/forge-business-rules.md §15/§18: fabricated testimonials are
 * explicitly prohibited, and the legacy site's own trust copy makes this
 * promise publicly ("Forge does not use fake testimonials"). Do not use
 * this component on a real page with placeholder content — no real
 * testimonial exists in the codebase yet (Human Decision #7). It is
 * demonstrated in /design-system with content clearly labeled as an
 * example, never in production copy.
 */
export function Testimonial({ quote, name, role }: TestimonialProps) {
  return (
    <figure className="rounded-2xl border border-border bg-white p-7">
      <blockquote className="text-body-lg text-ink">&ldquo;{quote}&rdquo;</blockquote>
      <figcaption className="mt-5 text-body-sm text-muted">
        <strong className="text-ink">{name}</strong> — {role}
      </figcaption>
    </figure>
  )
}
