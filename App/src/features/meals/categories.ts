import { listCategories, type CategoryRow } from '../../backend/catalog'
import { text } from '../../backend/catalogText'
import { getMeal } from './meals'

export interface MealCategory {
  // The category slug; also the key of its translated name.
  id: string
  emoji: string
  readonly label: string
}

const toCategory = (row: CategoryRow): MealCategory => ({
  id: row.slug,
  emoji: row.emoji,
  get label() {
    return text(row.slug)
  },
})

let mealCategoryList: MealCategory[] | null = null
let methodCategoryList: MealCategory[] | null = null

// Categories of kind 'meal' (chicken, beef, ...): a meal belongs to at most one.
export function getMealCategories(): MealCategory[] {
  return (mealCategoryList ??= listCategories('meal').map(toCategory))
}

// Categories of kind 'method' (hob, oven, airfryer, microwave).
export function getMethodCategories(): MealCategory[] {
  return (methodCategoryList ??= listCategories('method').map(toCategory))
}

export function mealCategories(mealId: string): MealCategory[] {
  const slug = getMeal(mealId)?.categorySlug
  const category = slug ? getMealCategories().find((c) => c.id === slug) : undefined
  return category ? [category] : []
}

// "🍟 Air fryer" style label of a cooking method.
export function methodLabel(method: string): string {
  const category = getMethodCategories().find((c) => c.id === method)
  return `${category?.emoji ?? ''} ${text(method)}`.trim()
}
