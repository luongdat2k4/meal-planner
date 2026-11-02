import { findMeal, recipeLines } from '../../backend/catalog'
import { toDayIndex, weekStart } from '../../shared/date'
import { usePlanner } from './usePlanner'

export interface PlanIngredient {
  ingredientSlug: string
  quantity: number
  unit: string
}

// Days of the week to shop for, as day indexes (0 = Monday), both ends included.
export interface DayRange {
  from: number
  to: number
}

// Ingredients of this week's plan for the given days (the whole week when no range is given), merged by
// (ingredient, unit). Each meal's amount is scaled by plan_item.servings / meal.base_servings, and pantry
// items (oil, salt, spices) are left out.
export function planIngredients(range?: DayRange): { weekStart: string; lines: PlanIngredient[] } {
  const totals = new Map<string, PlanIngredient>()
  for (const item of usePlanner().state.items) {
    const day = toDayIndex(item.weekday)
    if (range && (day < range.from || day > range.to)) continue
    const meal = findMeal(item.mealSlug)
    if (!meal) continue
    const scale = item.servings / meal.baseServings
    for (const line of recipeLines(item.mealSlug)) {
      if (line.isPantry) continue
      const key = `${line.ingredientSlug}|${line.unit}`
      const entry = totals.get(key) ?? { ingredientSlug: line.ingredientSlug, quantity: 0, unit: line.unit }
      entry.quantity += line.amount * scale
      totals.set(key, entry)
    }
  }
  return { weekStart: weekStart(), lines: [...totals.values()] }
}
