import { findMeal, recipeLines } from '../../backend/catalog'
import { weekStart } from '../../shared/date'
import { usePlanner } from './usePlanner'

export interface PlanIngredient {
  ingredientSlug: string
  quantity: number
  unit: string
}

// Ingredients of this week's plan, merged by (ingredient, unit). Each meal's amount is scaled by
// plan_item.servings / meal.base_servings, and pantry items (oil, salt, spices) are left out.
export function planIngredients(): { weekStart: string; lines: PlanIngredient[] } {
  const totals = new Map<string, PlanIngredient>()
  for (const item of usePlanner().state.items) {
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
