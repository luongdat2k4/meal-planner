import { computed } from 'vue'
import { TRIAL_DAYS, type PlanId } from '../../mock-data/plans'
import { createPersistedState } from '../../shared/persisted'

interface PremiumState {
  plan: PlanId | null
  trialStartedAt: string | null
}

const defaults = (): PremiumState => ({ plan: null, trialStartedAt: null })

const state = createPersistedState<PremiumState>('meal-planner:premium', defaults)

const isPremium = computed(() => state.plan !== null)
const trialDaysLeft = computed(() => {
  if (!state.trialStartedAt) return 0
  const elapsedDays = Math.floor((Date.now() - new Date(state.trialStartedAt).getTime()) / 86_400_000)
  return Math.max(0, TRIAL_DAYS - elapsedDays)
})

export function usePremium() {
  // MOCK: starts a local trial flag only; nothing is charged.
  function startTrial(plan: PlanId) {
    state.plan = plan
    state.trialStartedAt = new Date().toISOString()
  }

  function cancel() {
    Object.assign(state, defaults())
  }

  return { state, isPremium, trialDaysLeft, startTrial, cancel, reset: cancel }
}
