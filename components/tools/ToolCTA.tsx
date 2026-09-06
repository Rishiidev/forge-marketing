'use client'

import type { ToolCtaDefinition } from '@/lib/tools/types'
import { CTA } from '@/components/marketing/CTA'
import { Button } from '@/components/ui/Button'
import { trackToolCtaClicked } from '@/lib/tools/analytics'

/**
 * The tools engine's contextual CTA — never a generic upsell.
 * `tool.primaryCTA`/`secondaryCTA` (lib/tools/types.ts) are declared by
 * each tool itself, tied to what it actually found: an SEO tool asks
 * "Want us to fix this?", a performance tool asks "Want a faster
 * site?", a local-signals tool asks "Want your business information
 * fixed across your website?" — each pointing at whatever's actually
 * relevant (the audit, a specific website tier, maintenance), not one
 * interchangeable pitch reused everywhere. See docs/tool-architecture.md
 * "Contextual CTA."
 */
export function ToolCTA({ toolSlug, primary, secondary }: { toolSlug: string; primary: ToolCtaDefinition; secondary?: ToolCtaDefinition }) {
  return (
    <CTA title={primary.headline} description={primary.description}>
      <Button href={primary.href} variant="onDark" size="lg" onClick={() => trackToolCtaClicked(toolSlug, primary.location, primary.href)}>
        {primary.label}
      </Button>
      {secondary && (
        <Button
          href={secondary.href}
          variant="onDarkSecondary"
          size="lg"
          onClick={() => trackToolCtaClicked(toolSlug, secondary.location, secondary.href)}
        >
          {secondary.label}
        </Button>
      )}
    </CTA>
  )
}
