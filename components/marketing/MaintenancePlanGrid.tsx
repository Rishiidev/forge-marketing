import type { MaintenancePlan } from '@/lib/constants'
import { MaintenancePlanCard } from './MaintenancePlanCard'

/**
 * Renders the three maintenance plans as a 3-column card grid on desktop,
 * 1-column on mobile. Replaces the inline 3-row flex layout that was
 * sitting in app/page.tsx section 9 — that layout stacked price + plan
 * name awkwardly on mobile and didn't give the featured plan any visual
 * weight. Now each plan is its own card with a clear hierarchy.
 *
 * The `featured` flag comes from lib/constants.ts MAINTENANCE_PLANS[i].featured,
 * not from a hardcoded position, so the data controls the visual.
 */
export function MaintenancePlanGrid({ plans }: { plans: MaintenancePlan[] }) {
  return (
    <div className="grid gap-4 border-t border-mark/15 pt-8 sm:grid-cols-3">
      {plans.map((plan) => (
        <MaintenancePlanCard
          key={plan.id}
          plan={plan}
          featured={plan.featured === true}
        />
      ))}
    </div>
  )
}