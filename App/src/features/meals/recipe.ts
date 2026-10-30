import { buildMockRecipe } from '../../mock-data/recipes'
import { getMeal } from './meals'
import type { CookMethod, Recipe } from './types'

export const METHOD_LABELS: Record<CookMethod, string> = {
  hob: '🍳 Bếp',
  oven: '♨️ Lò nướng',
  airfryer: '🍟 Air fryer',
  microwave: '⚡ Lò vi sóng',
}

// Rough difficulty derived from total time (mock until real data has a level).
export function getLevel(recipe: Recipe): 'Dễ' | 'Vừa' | 'Khó' {
  const total = recipe.prepMinutes + recipe.cookMinutes
  return total <= 25 ? 'Dễ' : total <= 45 ? 'Vừa' : 'Khó'
}

const cache = new Map<string, Recipe>()

// Recipes are mock data for now; swap buildMockRecipe for real data when it exists.
export function getRecipe(mealId: string): Recipe | null {
  const cached = cache.get(mealId)
  if (cached) return cached
  const meal = getMeal(mealId)
  if (!meal) return null
  const recipe = buildMockRecipe(meal)
  cache.set(mealId, recipe)
  return recipe
}
