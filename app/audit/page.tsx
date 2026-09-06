import { buildMetadata } from '@/lib/seo'
import { AuditTool } from '@/components/audit/AuditTool'

export const metadata = buildMetadata({
  title: 'Free Website & Google Profile Audit',
  description:
    "Answer 9 quick questions about your Google Business Profile and website. Get an instant, honest breakdown of what's good, what's missing, and what to fix first.",
  path: '/audit',
})

/**
 * The interactive Forge Free Audit tool — see
 * components/audit/AuditTool.tsx for the flow (landing → input →
 * processing → result/recommendation/CTA) and docs/decisions.md ADR-009
 * for why this replaced the previous single contact-form page. The
 * simpler embedded AuditForm still exists (components/audit/AuditForm.tsx)
 * and is intentionally untouched — it's still used on the homepage and
 * /design-system.
 */
export default function AuditPage() {
  return <AuditTool />
}
