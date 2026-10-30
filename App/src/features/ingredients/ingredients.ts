import { listIngredients, type IngredientRow } from '../../backend/catalog'
import { text } from '../../backend/catalogText'
import type { Ingredient } from './types'

function toIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.slug,
    image: row.image,
    get name() {
      return text(row.slug)
    },
  }
}

// Built on first use: the catalog database is opened before the app mounts, not when this module loads.
let ingredients: Ingredient[] | null = null

export function getIngredients(): Ingredient[] {
  return (ingredients ??= listIngredients().map(toIngredient))
}
