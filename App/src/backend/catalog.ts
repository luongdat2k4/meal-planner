import { all, catalogDb } from './database'

// Read-only queries over catalog.db. Tables link to each other by `slug`; names live in the i18n files.

export type CategoryKind = 'meal' | 'method'
export type CategoryRow = { slug: string; emoji: string; kind: CategoryKind }
export type IngredientRow = { slug: string; image: string; section: string | null; isPantry: boolean }
export type MealRow = {
  slug: string
  categorySlug: string | null
  image: string
  baseServings: number
  prepMinutes: number
  cookMinutes: number
  // VND per serving.
  pricePerServing: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  dietary: string[]
  allergens: string[]
  methods: string[]
  // method -> step numbers; the text is `stepText(slug, method, n)`.
  steps: Record<string, number[]>
}
export type RecipeLine = { ingredientSlug: string; image: string; amount: number; unit: string; isPantry: boolean }

// JSON columns come back from SQLite as text.
function json<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === 'string' ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const num = (value: unknown) => Number(value ?? 0)
const str = (value: unknown) => (value === null || value === undefined ? null : String(value))

let categories: CategoryRow[] = []
let ingredients: IngredientRow[] = []
let meals: MealRow[] = []
let mealBySlug = new Map<string, MealRow>()
let ingredientSlugs = new Set<string>()
const lines = new Map<string, RecipeLine[]>()

/** Reads the small catalog tables into memory once, right after the database is opened. */
export function loadCatalog() {
  const db = catalogDb()
  categories = all(db, 'SELECT slug, emoji, kind FROM category ORDER BY sort_order').map((row) => ({
    slug: String(row.slug),
    emoji: String(row.emoji ?? ''),
    kind: row.kind === 'method' ? 'method' : 'meal',
  }))
  ingredients = all(db, 'SELECT slug, image, section, is_pantry FROM ingredient ORDER BY slug').map((row) => ({
    slug: String(row.slug),
    image: String(row.image ?? ''),
    section: str(row.section),
    isPantry: row.is_pantry === 1,
  }))
  ingredientSlugs = new Set(ingredients.map((ingredient) => ingredient.slug))
  meals = all(db, 'SELECT * FROM meal ORDER BY slug').map((row) => ({
    slug: String(row.slug),
    categorySlug: str(row.category_slug),
    image: String(row.image ?? ''),
    baseServings: num(row.base_servings) || 2,
    prepMinutes: num(row.prep_minutes),
    cookMinutes: num(row.cook_minutes),
    pricePerServing: num(row.price_serving),
    calories: num(row.calories),
    proteinG: num(row.protein_g),
    carbsG: num(row.carbs_g),
    fatG: num(row.fat_g),
    dietary: json<string[]>(row.dietary, []),
    allergens: json<string[]>(row.allergens, []),
    methods: json<string[]>(row.methods, []),
    steps: json<Record<string, number[]>>(row.steps, {}),
  }))
  mealBySlug = new Map(meals.map((meal) => [meal.slug, meal]))
}

export const listCategories = (kind?: CategoryKind) => (kind ? categories.filter((c) => c.kind === kind) : categories)
export const listIngredients = () => ingredients
export const listMeals = () => meals
export const findMeal = (slug: string) => mealBySlug.get(slug)
export const hasMeal = (slug: string) => mealBySlug.has(slug)
export const hasIngredient = (slug: string) => ingredientSlugs.has(slug)

/** The ingredients of one meal, for `baseServings`. */
export function recipeLines(mealSlug: string): RecipeLine[] {
  const cached = lines.get(mealSlug)
  if (cached) return cached
  const result = all(
    catalogDb(),
    `SELECT mi.ingredient_slug, mi.amount, mi.unit, i.image, i.is_pantry
     FROM meal_ingredient mi JOIN ingredient i ON i.slug = mi.ingredient_slug
     WHERE mi.meal_slug = ? ORDER BY mi.rowid`,
    [mealSlug],
  ).map((row) => ({
    ingredientSlug: String(row.ingredient_slug),
    image: String(row.image ?? ''),
    amount: num(row.amount),
    unit: String(row.unit),
    isPantry: row.is_pantry === 1,
  }))
  lines.set(mealSlug, result)
  return result
}
