'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { AUDIT_CATEGORIES, computeAuditResult, type AuditInput, type AuditResult } from '@/lib/audit'
import { AuditInputForm } from './AuditInputForm'
import { AuditProcessing } from './AuditProcessing'
import { AuditResultView } from './AuditResultView'
import { PageHero } from '@/components/marketing/PageHero'
import { FeatureList } from '@/components/marketing/FeatureList'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

type Step = 'landing' | 'input' | 'processing' | 'result'

/**
 * Orchestrates the Forge Free Audit flow: landing → input → processing →
 * result (which itself renders the recommendation and CTA, per the
 * brief). One component owns the step state because the steps are
 * mutually exclusive views of one session, not separate routes — no
 * server round-trip happens until the visitor optionally submits contact
 * info at the very end (AuditLeadCaptureForm). See docs/decisions.md
 * ADR-009 and docs/architecture.md "The audit tool system."
 */
export function AuditTool() {
  const [step, setStep] = useState<Step>('landing')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [contextFields, setContextFields] = useState<{ industry?: string; location?: string }>({})

  function handleStart() {
    trackEvent({ name: 'audit_started', props: { source: 'audit' } })
    setStep('input')
  }

  function handleInputSubmit(input: AuditInput) {
    trackEvent({ name: 'audit_submitted', props: {} })
    setContextFields({ industry: input.industry, location: input.location })
    setStep('processing')
    // See components/audit/AuditProcessing.tsx — this delay is a
    // perceived-progress courtesy around an instant, pure computation,
    // not a stand-in for a real backend scan.
    window.setTimeout(() => {
      setResult(computeAuditResult(input))
      setStep('result')
    }, 1100)
  }

  if (step === 'landing') {
    return (
      <>
        <PageHero
          eyebrow="Free website & Google profile audit"
          title="See what your Google profile and website are telling customers."
          description="Answer 9 quick questions about your business. Get an instant, honest breakdown of what's good, what's missing, why it matters, and what to fix first — no software score, no upsell inside the audit."
        >
          <Button type="button" size="lg" className="mt-8" onClick={handleStart}>
            Start my free audit
          </Button>
        </PageHero>
        <Section spacing="tight" className="pt-0">
          <FeatureList items={AUDIT_CATEGORIES.map((c) => ({ title: c.label, description: c.whyItMatters }))} />
        </Section>
      </>
    )
  }

  return (
    <Section spacing="tight">
      {step === 'input' && <AuditInputForm onSubmit={handleInputSubmit} />}
      {step === 'processing' && <AuditProcessing />}
      {step === 'result' && result && (
        <AuditResultView result={result} industry={contextFields.industry} location={contextFields.location} />
      )}
    </Section>
  )
}
