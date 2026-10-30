import { computed } from 'vue'
import { createPersistedState } from '../../shared/persisted'

interface PlannerState {
  // Day index (0 = Monday) -> meal ids planned for that day.
  plan: Record<number, string[]>
}

const state = createPersistedState<PlannerState>('meal-planner:plan', () => ({ plan: {} }))

const plannedMealCount = computed(() => Object.values(state.plan).reduce((sum, list) => sum + list.length, 0))

export function usePlanner() {
  function addMealToDay(day: number, mealId: string) {
    const list = state.plan[day] ?? []
    state.plan[day] = [...list, mealId]
  }

  function removeMealFromDay(day: number, index: number) {
    state.plan[day] = (state.plan[day] ?? []).filter((_, i) => i !== index)
  }

  function clearDay(day: number) {
    state.plan[day] = []
  }

  function reset() {
    state.plan = {}
  }

  return { state, plannedMealCount, addMealToDay, removeMealFromDay, clearDay, reset }
}
