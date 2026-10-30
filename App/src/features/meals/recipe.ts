import { findMeal, recipeLines } from '../../backend/catalog'
import { stepText, text } from '../../backend/catalogText'
import type { CookMethod, Recipe } from './types'

// Rough difficulty derived from total time (the catalog has no level column).
export function getLevel(recipe: Recipe): 'easy' | 'medium' | 'hard' {
  const total = recipe.prepMinutes + recipe.cookMinutes
  return total <= 25 ? 'easy' : total <= 45 ? 'medium' : 'hard'
}

const cache = new Map<string, Recipe>()

export function getRecipe(mealId: string): Recipe | null {
  const cached = cache.get(mealId)
  if (cached) return cached
  const row = findMeal(mealId)
  if (!row) return null

  const recipe: Recipe = {
    mealId: row.slug,
    baseServings: row.baseServings,
    prepMinutes: row.prepMinutes,
    cookMinutes: row.cookMinutes,
    pricePerServing: row.pricePerServing,
    macros: { calories: row.calories, protein: row.proteinG, carbs: row.carbsG, fat: row.fatG },
    dietary: row.dietary,
    allergens: row.allergens,
    ingredients: recipeLines(row.slug).map((line) => ({
      ingredientId: line.ingredientSlug,
      get name() {
        return text(line.ingredientSlug)
      },
      image: line.image,
      amount: line.amount,
      unit: line.unit,
    })),
    methods: row.methods as CookMethod[],
    get steps() {
      const steps: Partial<Record<CookMethod, string[]>> = {}
      for (const [method, numbers] of Object.entries(row.steps)) {
        steps[method as CookMethod] = numbers.map((n) => stepText(row.slug, method, n))
      }
      return steps
    },
  }
  cache.set(mealId, recipe)
  return recipe
}
