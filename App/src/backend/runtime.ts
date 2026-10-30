import { hasIngredient, hasMeal } from './catalog'
import { all, one, runtimeDb, transaction, write } from './database'

// Queries and writes over runtime.db (preference, meal_activity, plan, plan_item, shopping_item).
// These tables point at catalog slugs without foreign keys, so every write checks the slug first.

const json = <T>(value: unknown, fallback: T): T => {
  try {
    return typeof value === 'string' ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}
const num = (value: unknown) => (value === null || value === undefined ? null : Number(value))
const str = (value: unknown) => (value === null || value === undefined ? null : String(value))

function requireMeal(slug: string) {
  if (!hasMeal(slug)) throw new Error(`Unknown meal: ${slug}`)
}

// ---- preference (exactly one row, id = 1)

export type PreferenceRow = {
  householdSize: number
  dietaryIds: string[]
  allergenIds: string[]
  proteinLikes: string[]
  dislikedMealSlugs: string[]
  // Weekdays 1..7, Monday = 1.
  cookingDays: number[]
  maxCookMinutes: number | null
  weeklyBudget: number | null
  weeklyReminder: boolean
}

export function getPreference(): PreferenceRow | null {
  const row = one(runtimeDb(), 'SELECT * FROM preference WHERE id = 1')
  if (!row) return null
  return {
    householdSize: Number(row.household_size ?? 2),
    dietaryIds: json<string[]>(row.dietary_ids, []),
    allergenIds: json<string[]>(row.allergen_ids, []),
    proteinLikes: json<string[]>(row.protein_likes, []),
    dislikedMealSlugs: json<string[]>(row.disliked_meal_slugs, []),
    cookingDays: json<number[]>(row.cooking_days, [1, 2, 3, 4, 5]),
    maxCookMinutes: num(row.max_cook_minutes),
    weeklyBudget: num(row.weekly_budget),
    weeklyReminder: row.weekly_reminder === 1,
  }
}

// disliked_meal_slugs is not written here: it changes only through setMealDisliked, together with meal_activity.
export function savePreference(p: Omit<PreferenceRow, 'dislikedMealSlugs'>) {
  write(
    `INSERT INTO preference (id, household_size, dietary_ids, allergen_ids, protein_likes,
                            cooking_days, max_cook_minutes, weekly_budget, weekly_reminder)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET household_size = excluded.household_size, dietary_ids = excluded.dietary_ids,
       allergen_ids = excluded.allergen_ids, protein_likes = excluded.protein_likes,
       cooking_days = excluded.cooking_days, max_cook_minutes = excluded.max_cook_minutes,
       weekly_budget = excluded.weekly_budget, weekly_reminder = excluded.weekly_reminder`,
    [
      p.householdSize,
      JSON.stringify(p.dietaryIds),
      JSON.stringify(p.allergenIds),
      JSON.stringify(p.proteinLikes),
      JSON.stringify(p.cookingDays),
      p.maxCookMinutes,
      p.weeklyBudget,
      p.weeklyReminder ? 1 : 0,
    ],
  )
}

// ---- meal_activity (one row per meal)

export type ActivityRow = {
  mealSlug: string
  isSaved: boolean
  isDisliked: boolean
  rating: number | null
  note: string | null
  lastCookedAt: string | null
  lastViewedAt: string | null
}

export const listActivity = (): ActivityRow[] =>
  all(runtimeDb(), 'SELECT * FROM meal_activity').map((row) => ({
    mealSlug: String(row.meal_slug),
    isSaved: row.is_saved === 1,
    isDisliked: row.is_disliked === 1,
    rating: num(row.rating),
    note: str(row.note),
    lastCookedAt: str(row.last_cooked_at),
    lastViewedAt: str(row.last_viewed_at),
  }))

const ACTIVITY_COLUMNS = {
  isSaved: 'is_saved',
  isDisliked: 'is_disliked',
  rating: 'rating',
  note: 'note',
  lastCookedAt: 'last_cooked_at',
  lastViewedAt: 'last_viewed_at',
} as const

export function patchActivity(mealSlug: string, patch: Partial<Omit<ActivityRow, 'mealSlug'>>) {
  requireMeal(mealSlug)
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined)
  transaction(() => {
    write('INSERT OR IGNORE INTO meal_activity (meal_slug) VALUES (?)', [mealSlug])
    if (!entries.length) return
    const assignments = entries.map(([key]) => `${ACTIVITY_COLUMNS[key as keyof typeof ACTIVITY_COLUMNS]} = ?`).join(', ')
    const values = entries.map(([, value]) => (typeof value === 'boolean' ? (value ? 1 : 0) : (value as string | number | null)))
    write(`UPDATE meal_activity SET ${assignments} WHERE meal_slug = ?`, [...values, mealSlug])
  })
}

/**
 * "Don't suggest this meal": the flag lives on meal_activity and the slug list on preference, which the plan
 * generator reads. Both change in one transaction so they cannot disagree.
 */
export function setMealDisliked(mealSlug: string, disliked: boolean) {
  requireMeal(mealSlug)
  transaction(() => {
    write('INSERT OR IGNORE INTO meal_activity (meal_slug) VALUES (?)', [mealSlug])
    write('UPDATE meal_activity SET is_disliked = ? WHERE meal_slug = ?', [disliked ? 1 : 0, mealSlug])
    write('INSERT OR IGNORE INTO preference (id) VALUES (1)')
    const row = one(runtimeDb(), 'SELECT disliked_meal_slugs FROM preference WHERE id = 1')
    const slugs = json<string[]>(row?.disliked_meal_slugs, []).filter((slug) => slug !== mealSlug)
    if (disliked) slugs.push(mealSlug)
    write('UPDATE preference SET disliked_meal_slugs = ? WHERE id = 1', [JSON.stringify(slugs)])
  })
}

// ---- plan (one row per week) and plan_item

export type PlanItemRow = {
  id: string
  weekStart: string
  // 1..7, Monday = 1.
  weekday: number
  position: number
  mealSlug: string
  servings: number
}

const planItem = (row: Record<string, unknown>): PlanItemRow => ({
  id: String(row.id),
  weekStart: String(row.week_start),
  weekday: Number(row.weekday),
  position: Number(row.position),
  mealSlug: String(row.meal_slug),
  servings: Number(row.servings),
})

export const listPlanItems = (weekStart: string): PlanItemRow[] =>
  all(runtimeDb(), 'SELECT * FROM plan_item WHERE week_start = ? ORDER BY weekday, position, rowid', [weekStart]).map(planItem)

/** Meals of the latest week before `weekStart`, used to avoid repeating last week's dinners. */
export const listPreviousWeekMeals = (weekStart: string): string[] =>
  all(
    runtimeDb(),
    `SELECT meal_slug FROM plan_item
     WHERE week_start = (SELECT max(week_start) FROM plan WHERE week_start < ?)`,
    [weekStart],
  ).map((row) => String(row.meal_slug))

function ensurePlan(weekStart: string, servings: number, budget: number | null) {
  write('INSERT OR IGNORE INTO plan (week_start, servings, budget) VALUES (?, ?, ?)', [weekStart, servings, budget])
}

export type NewPlanItem = { weekday: number; mealSlug: string; servings: number }

const insertItemSql =
  'INSERT INTO plan_item (id, week_start, weekday, position, meal_slug, servings) VALUES (?, ?, ?, ?, ?, ?)'

/** Replaces every item of the week with `items` (positions follow the order given per weekday). */
export function replacePlanItems(weekStart: string, servings: number, budget: number | null, items: NewPlanItem[]) {
  for (const item of items) requireMeal(item.mealSlug)
  transaction(() => {
    ensurePlan(weekStart, servings, budget)
    write('UPDATE plan SET servings = ?, budget = ? WHERE week_start = ?', [servings, budget, weekStart])
    write('DELETE FROM plan_item WHERE week_start = ?', [weekStart])
    const next = new Map<number, number>()
    for (const item of items) {
      const position = next.get(item.weekday) ?? 0
      next.set(item.weekday, position + 1)
      write(insertItemSql, [crypto.randomUUID(), weekStart, item.weekday, position, item.mealSlug, item.servings])
    }
  })
}

export function insertPlanItem(weekStart: string, servings: number, budget: number | null, item: NewPlanItem) {
  requireMeal(item.mealSlug)
  transaction(() => {
    ensurePlan(weekStart, servings, budget)
    const last = one(runtimeDb(), 'SELECT max(position) AS p FROM plan_item WHERE week_start = ? AND weekday = ?', [weekStart, item.weekday])
    const position = last?.p === null || last?.p === undefined ? 0 : Number(last.p) + 1
    write(insertItemSql, [crypto.randomUUID(), weekStart, item.weekday, position, item.mealSlug, item.servings])
  })
}

export function replacePlanItemMeal(id: string, mealSlug: string) {
  requireMeal(mealSlug)
  write('UPDATE plan_item SET meal_slug = ? WHERE id = ?', [mealSlug, id])
}

export const deletePlanItem = (id: string) => write('DELETE FROM plan_item WHERE id = ?', [id])

export const deletePlanDay = (weekStart: string, weekday: number) =>
  write('DELETE FROM plan_item WHERE week_start = ? AND weekday = ?', [weekStart, weekday])

// ---- shopping_item

export type ShoppingRow = {
  id: string
  weekStart: string | null
  ingredientSlug: string | null
  // Free text for hand-typed items; empty for items that come from an ingredient.
  label: string
  quantity: number | null
  unit: string | null
  checked: boolean
  storeId: string | null
}

export const listShopping = (): ShoppingRow[] =>
  all(runtimeDb(), 'SELECT * FROM shopping_item ORDER BY checked, rowid').map((row) => ({
    id: String(row.id),
    weekStart: str(row.week_start),
    ingredientSlug: str(row.ingredient_slug),
    label: String(row.label ?? ''),
    quantity: num(row.quantity),
    unit: str(row.unit),
    checked: row.checked === 1,
    storeId: str(row.store_id),
  }))

export type NewShoppingItem = {
  weekStart: string | null
  ingredientSlug: string | null
  label: string
  quantity: number | null
  unit: string | null
  storeId: string | null
}

const insertShoppingSql = `INSERT INTO shopping_item (id, week_start, ingredient_slug, label, quantity, unit, checked, store_id)
                           VALUES (?, ?, ?, ?, ?, ?, 0, ?)`

export function insertShopping(item: NewShoppingItem) {
  if (item.ingredientSlug && !hasIngredient(item.ingredientSlug)) throw new Error(`Unknown ingredient: ${item.ingredientSlug}`)
  write(insertShoppingSql, [crypto.randomUUID(), item.weekStart, item.ingredientSlug, item.label, item.quantity, item.unit, item.storeId])
}

export type PlanShoppingLine = {
  weekStart: string
  ingredientSlug: string
  quantity: number
  unit: string
  storeId: string | null
}

/**
 * Adds ingredient lines gathered from a plan. A line already on the list for the same
 * (week, ingredient, unit) is left alone, so hand edits and ticks survive a second import.
 * Returns how many lines were new.
 */
export function importShopping(lines: PlanShoppingLine[]): number {
  let added = 0
  transaction(() => {
    for (const line of lines) {
      if (!hasIngredient(line.ingredientSlug)) throw new Error(`Unknown ingredient: ${line.ingredientSlug}`)
      // The unique index on (week_start, ingredient_slug, unit) is partial, so the conflict target repeats its WHERE.
      added += write(
        `INSERT INTO shopping_item (id, week_start, ingredient_slug, label, quantity, unit, checked, store_id)
         VALUES (?, ?, ?, '', ?, ?, 0, ?)
         ON CONFLICT(week_start, ingredient_slug, unit) WHERE ingredient_slug IS NOT NULL DO NOTHING`,
        [crypto.randomUUID(), line.weekStart, line.ingredientSlug, line.quantity, line.unit, line.storeId],
      )
    }
  })
  return added
}

export const setShoppingChecked = (id: string, checked: boolean) =>
  write('UPDATE shopping_item SET checked = ? WHERE id = ?', [checked ? 1 : 0, id])

export const deleteShopping = (id: string) => write('DELETE FROM shopping_item WHERE id = ?', [id])

export const deleteCheckedShopping = () => write('DELETE FROM shopping_item WHERE checked = 1')

export const setShoppingStore = (storeId: string | null) => write('UPDATE shopping_item SET store_id = ?', [storeId])

/** Empties every runtime table, as if the app had just been installed. */
export function resetRuntime() {
  transaction(() => {
    for (const table of ['shopping_item', 'plan_item', 'plan', 'meal_activity', 'preference']) write(`DELETE FROM ${table}`)
  })
}
