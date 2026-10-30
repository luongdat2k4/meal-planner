export interface Meal {
  id: string
  title: string
  image: string
}

export type CookMethod = 'hob' | 'oven' | 'airfryer' | 'microwave'

export interface RecipeIngredient {
  ingredientId: string
  name: string
  image: string
  // Amount for `baseServings`.
  amount: number
  unit: string
}

export interface Macros {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface Recipe {
  mealId: string
  baseServings: number
  prepMinutes: number
  cookMinutes: number
  // VND per serving.
  pricePerServing: number
  // Per serving.
  macros: Macros
  // Dietary ids this meal satisfies, and allergen ids it contains.
  dietary: string[]
  allergens: string[]
  ingredients: RecipeIngredient[]
  methods: CookMethod[]
  steps: Partial<Record<CookMethod, string[]>>
}
