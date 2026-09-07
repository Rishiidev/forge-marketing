import type { Finding } from '@/lib/website-analyzer/types'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

const SEVERITY_TONE = { good: 'success', info: 'neutral', warning: 'warning', critical: 'warning' } as const

/**
 * CRITICAL, per the task brief: "Clearly distinguish LAB DATA / FIELD
 * DATA / UNAVAILABLE." This badge is the concrete mechanism — every
 * Core Web Vital card shows exactly one of these three, read directly
 * from the underlying `Finding.dataOrigin` (lib/pagespeed/findings.ts),
 * never inferred or defaulted.
 */
const DATA_ORIGIN_LABEL: Record<string, string> = {
  field: 'Field data (real visitors)',
  lab: 'Lab data (simulated)',
  unavailable: 'Unavailable',
  internal: 'Internal check',
}

function metricValue(finding: Finding): string {
  const value = finding.evidence.displayValue
  return typeof value === 'string' ? value : '—'
}

/** The "Core Web Vitals" step (task brief §5) — LCP/CLS/INP/FCP/TTFB, each labeled Good/Needs attention/Priority via severity, and tagged with exactly which kind of data (or lack of it) produced the number. */
export function CoreWebVitalsPanel({ pagespeedFindings }: { pagespeedFindings: Finding[] }) {
  const cwvFindings = pagespeedFindings.filter((f) => f.id.startsWith('pagespeed-cwv-'))
  if (cwvFindings.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cwvFindings.map((finding) => (
        <div key={finding.id} className="rounded-2xl border border-border bg-white p-5">
          <Text as="span" size="caption" className="mb-2 block">
            {finding.title}
          </Text>
          <Heading as="p" size="heading-md" className="mb-2">
            {finding.dataOrigin === 'unavailable' ? '—' : metricValue(finding)}
          </Heading>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone={SEVERITY_TONE[finding.severity]}>{finding.severity === 'good' ? 'Good' : finding.severity === 'critical' ? 'Priority' : finding.severity === 'warning' ? 'Needs attention' : 'Info'}</Badge>
          </div>
          <Text size="caption" className="text-muted">
            {DATA_ORIGIN_LABEL[finding.dataOrigin ?? 'unavailable']}
          </Text>
        </div>
      ))}
    </div>
  )
}
