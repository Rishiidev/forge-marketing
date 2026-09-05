interface MetricProps {
  value: string
  label: string
  tone?: 'onLight' | 'onDark'
}

/**
 * A single big-number stat. Purely a display primitive — it has no
 * opinion about where `value` comes from.
 *
 * IMPORTANT: docs/forge-business-rules.md explicitly prohibits fabricated
 * metrics ("no claimed conversion numbers," §18). Only pass a value here
 * that is real and current. Do not hard-code an example number into a
 * real page "to fill the space" — leave the section out until there's a
 * real one, the same discipline already applied to CAPACITY, WEBSITE_TIERS,
 * and the showcase content in this codebase.
 */
export function Metric({ value, label, tone = 'onLight' }: MetricProps) {
  return (
    <div className="text-center">
      <div className={tone === 'onDark' ? 'text-heading-md text-mark' : 'text-heading-md text-ink'}>{value}</div>
      <div className={tone === 'onDark' ? 'mt-1 text-body-sm text-mark/70' : 'mt-1 text-body-sm text-muted'}>
        {label}
      </div>
    </div>
  )
}

export function MetricRow({ metrics, tone }: { metrics: MetricProps[]; tone?: MetricProps['tone'] }) {
  return (
    <div
      className={
        tone === 'onDark'
          ? 'grid grid-cols-3 gap-6 border-y border-mark/15 py-6'
          : 'grid grid-cols-3 gap-6 border-y border-border py-6'
      }
    >
      {metrics.map((metric, i) => (
        // Index, not label — labels aren't guaranteed unique (e.g. repeated across metrics).
        <Metric key={i} {...metric} tone={tone} />
      ))}
    </div>
  )
}
