import { computed } from 'vue'
import { createPersistedState } from '../../shared/persisted'

type Plan = Record<number, string[]>

interface PlannerState {
  // Day index (0 = Monday) -> meal ids planned for that day.
  plan: Plan
  // The plan replaced by the last generation, used to avoid repeating meals.
  previousPlan: Plan
}

const state = createPersistedState<PlannerState>('meal-planner:plan', () => ({ plan: {}, previousPlan: {} }))

const plannedMealCount = computed(() => Object.values(state.plan).reduce((sum, list) => sum + list.length, 0))

export function usePlanner() {
  function addMealToDay(day: number, mealId: string) {
    const list = state.plan[day] ?? []
    state.plan[day] = [...list, mealId]
  }

  function removeMealFromDay(day: number, index: number) {
    state.plan[day] = (state.plan[day] ?? []).filter((_, i) => i !== index)
  }

  function replaceMeal(day: number, index: number, mealId: string) {
    state.plan[day] = (state.plan[day] ?? []).map((id, i) => (i === index ? mealId : id))
  }

  function clearDay(day: number) {
    state.plan[day] = []
  }

  function applyGeneratedPlan(plan: Plan) {
    state.previousPlan = state.plan
    state.plan = plan
  }

  function reset() {
    state.plan = {}
    state.previousPlan = {}
  }

  return { state, plannedMealCount, addMealToDay, removeMealFromDay, replaceMeal, clearDay, applyGeneratedPlan, reset }
}
