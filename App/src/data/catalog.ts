import dietaryJson from './dietary.json'
import ingredientsJson from './ingredients.json'
import mealsJson from './meals.json'
import storesJson from './stores.json'
import type { Dietary, Ingredient, Meal, Store } from '../types'

export const MEALS: Meal[] = mealsJson
export const INGREDIENTS: Ingredient[] = ingredientsJson
export const STORES: Store[] = storesJson
export const DIETARY: Dietary[] = dietaryJson

// Image paths in the JSON are relative to the public folder.
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}
