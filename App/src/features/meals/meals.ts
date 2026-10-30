import { listMeals, type MealRow } from '../../backend/catalog'
import { text } from '../../backend/catalogText'
import type { Meal } from './types'

function toMeal(row: MealRow): Meal {
  return {
    id: row.slug,
    image: row.image,
    categorySlug: row.categorySlug,
    get title() {
      return text(row.slug)
    },
  }
}

// Built on first use: the catalog database is opened before the app mounts, not when this module loads.
let meals: Meal[] | null = null
let mealById = new Map<string, Meal>()

export function getMeals(): Meal[] {
  if (!meals) {
    meals = listMeals().map(toMeal)
    mealById = new Map(meals.map((meal) => [meal.id, meal]))
  }
  return meals
}

export function getMeal(id: string): Meal | undefined {
  getMeals()
  return mealById.get(id)
}
