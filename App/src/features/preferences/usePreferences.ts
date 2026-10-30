import { createPersistedState } from '../../shared/persisted'
import type { Preferences } from './types'

const defaults = (): Preferences => ({
  onboardingDone: false,
  onboardingStep: 0,
  householdSize: 2,
  dietaryIds: [],
  allergenIds: [],
  proteinLikes: [],
  cookingDays: [0, 1, 2, 3, 4],
  maxCookMinutes: 45,
  weeklyBudget: 1_200_000,
  reminder: { enabled: false, day: 6, time: '18:00' },
})

const state = createPersistedState<Preferences>('meal-planner:preferences', defaults)

export function usePreferences() {
  function completeOnboarding() {
    state.onboardingDone = true
    state.onboardingStep = 0
  }

  function reset() {
    Object.assign(state, defaults())
  }

  return { state, completeOnboarding, reset }
}
