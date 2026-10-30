import { t } from '../shared/i18n'

// MOCK DATA: subscription plans and prices are placeholders; no real payment exists.
export type PlanId = 'individual' | 'family'

export interface PlanOption {
  id: PlanId
  name: string
  // VND per month.
  price: number
  members: number
  badge?: string
  perks: string[]
}

export const TRIAL_DAYS = 7

// Text fields are getters so they resolve in the current language at render time.
export const PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'individual',
    get name() {
      return t('premium.plans.individual.name')
    },
    price: 79_000,
    members: 1,
    get perks() {
      return [t('premium.plans.individual.perk1'), t('premium.plans.individual.perk2')]
    },
  },
  {
    id: 'family',
    get name() {
      return t('premium.plans.family.name')
    },
    price: 129_000,
    members: 5,
    get badge() {
      return t('premium.plans.family.badge')
    },
    get perks() {
      return [t('premium.plans.family.perk1'), t('premium.plans.family.perk2')]
    },
  },
]

// Translation keys; resolve with t() when rendering.
export const PREMIUM_BENEFITS = ['premium.benefits.b1', 'premium.benefits.b2', 'premium.benefits.b3', 'premium.benefits.b4']

export const CANCEL_REASONS = ['premium.reasons.r1', 'premium.reasons.r2', 'premium.reasons.r3', 'premium.reasons.r4']
