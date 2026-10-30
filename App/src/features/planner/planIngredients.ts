import { formatAmount } from '../../shared/format'
import { getRecipe } from '../meals'
import { usePreferences } from '../preferences'
import { usePlanner } from './usePlanner'

// Shopping labels for every ingredient in this week's plan, merged and scaled to the household size.
export function planIngredientLabels(): string[] {
  const people = usePreferences().state.householdSize
  const totals = new Map<string, { name: string; unit: string; amount: number }>()

  for (const mealId of Object.values(usePlanner().state.plan).flat()) {
    const recipe = getRecipe(mealId)
    if (!recipe) continue
    const scale = people / recipe.baseServings
    for (const item of recipe.ingredients) {
      const key = `${item.ingredientId}|${item.unit}`
      const entry = totals.get(key) ?? { name: item.name, unit: item.unit, amount: 0 }
      entry.amount += item.amount * scale
      totals.set(key, entry)
    }
  }

  return [...totals.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => `${entry.name} · ${formatAmount(entry.amount, entry.unit)}`)
}
