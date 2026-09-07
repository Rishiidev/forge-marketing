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
 *
 * `onCtaClick`: an optional extra callback fired alongside the built-in
 * `tool_cta_clicked` tracking — for a tool with its own bespoke
 * analytics taxonomy (e.g. lib/pagespeed/'s `pagespeed_cta_clicked`,
 * components/pagespeed/PageSpeedTool.tsx) that needs to fire in
 * addition to, not instead of, the generic event every tool already
 * gets for free.
 */
export function ToolCTA({
  toolSlug,
  primary,
  secondary,
  onCtaClick,
}: {
  toolSlug: string
  primary: ToolCtaDefinition
  secondary?: ToolCtaDefinition
  onCtaClick?: (cta: ToolCtaDefinition) => void
}) {
  return (
    <CTA title={primary.headline} description={primary.description}>
      <Button
        href={primary.href}
        variant="onDark"
        size="lg"
        onClick={() => {
          trackToolCtaClicked(toolSlug, primary.location, primary.href)
          onCtaClick?.(primary)
        }}
      >
        {primary.label}
      </Button>
      {secondary && (
        <Button
          href={secondary.href}
          variant="onDarkSecondary"
          size="lg"
          onClick={() => {
            trackToolCtaClicked(toolSlug, secondary.location, secondary.href)
            onCtaClick?.(secondary)
          }}
        >
          {secondary.label}
        </Button>
      )}
    </CTA>
  )
}
