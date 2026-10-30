export interface Meal {
  // The catalog slug; also the key of the meal's translated name.
  id: string
  // Translated name, read through the i18n files so it follows the language switch.
  readonly title: string
  image: string
  categorySlug: string | null
}

export type CookMethod = 'hob' | 'oven' | 'airfryer' | 'microwave'

export interface RecipeIngredient {
  // Ingredient slug.
  ingredientId: string
  readonly name: string
  image: string
  // Amount for `baseServings`.
  amount: number
  // Unit slug: g, tbsp, tsp, piece.
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
  // Translated step text per cooking method.
  readonly steps: Partial<Record<CookMethod, string[]>>
}
