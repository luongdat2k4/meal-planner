import { computed } from 'vue'
import { dataVersion } from '../../backend/database'
import {
  deletePlanDay,
  deletePlanItem,
  insertPlanItem,
  listPlanItems,
  replacePlanItemMeal,
  replacePlanItems,
  type PlanItemRow,
} from '../../backend/runtime'
import { toDayIndex, toWeekday, weekStart } from '../../shared/date'
import { usePreferences } from '../preferences'

// Day index (0 = Monday) -> meal slugs planned for that day, in order.
export type Plan = Record<number, string[]>

// This calendar week's plan_item rows. A new week starts empty; earlier weeks stay as history.
const items = computed<PlanItemRow[]>(() => {
  void dataVersion.value
  return listPlanItems(weekStart())
})

const plan = computed<Plan>(() => {
  const result: Plan = {}
  for (const item of items.value) (result[toDayIndex(item.weekday)] ??= []).push(item.mealSlug)
  return result
})

const plannedMealCount = computed(() => items.value.length)

const state = {
  get plan(): Plan {
    return plan.value
  },
  get items(): PlanItemRow[] {
    return items.value
  },
}

const itemsOfDay = (day: number) => items.value.filter((item) => item.weekday === toWeekday(day))

export function usePlanner() {
  const prefs = usePreferences().state

  function addMealToDay(day: number, mealId: string) {
    insertPlanItem(weekStart(), prefs.householdSize, prefs.weeklyBudget, {
      weekday: toWeekday(day),
      mealSlug: mealId,
      servings: prefs.householdSize,
    })
  }

  function removeMealFromDay(day: number, index: number) {
    const item = itemsOfDay(day)[index]
    if (item) deletePlanItem(item.id)
  }

  function replaceMeal(day: number, index: number, mealId: string) {
    const item = itemsOfDay(day)[index]
    if (item) replacePlanItemMeal(item.id, mealId)
  }

  function clearDay(day: number) {
    deletePlanDay(weekStart(), toWeekday(day))
  }

  function applyGeneratedPlan(next: Plan) {
    const rows = Object.entries(next).flatMap(([day, slugs]) =>
      slugs.map((mealSlug) => ({ weekday: toWeekday(Number(day)), mealSlug, servings: prefs.householdSize })),
    )
    replacePlanItems(weekStart(), prefs.householdSize, prefs.weeklyBudget, rows)
  }

  return { state, plannedMealCount, addMealToDay, removeMealFromDay, replaceMeal, clearDay, applyGeneratedPlan }
}
