import { listPreviousWeekMeals } from '../../backend/runtime'
import { weekStart } from '../../shared/date'
import { getMeals, getRecipe, useFavorites, useMealActivity, type Meal } from '../meals'
import { usePreferences, type Preferences } from '../preferences'
import { usePlanner, type Plan } from './usePlanner'

const REPEAT_DAYS = 14

const mealCost = (mealId: string, people: number) => (getRecipe(mealId)?.pricePerServing ?? 0) * people

// Cost of this week's plan: price per serving x the servings stored on each plan_item.
export function planCost(): number {
  return usePlanner().state.items.reduce((sum, item) => sum + mealCost(item.mealSlug, item.servings), 0)
}

// A meal fits when it satisfies every dietary choice, avoids every allergen and (optionally) the time limit.
function isEligible(meal: Meal, prefs: Preferences, enforceTime: boolean): boolean {
  const recipe = getRecipe(meal.id)
  if (!recipe) return false
  if (prefs.dietaryIds.some((id) => !recipe.dietary.includes(id))) return false
  if (prefs.allergenIds.some((id) => recipe.allergens.includes(id))) return false
  return !enforceTime || recipe.prepMinutes + recipe.cookMinutes <= prefs.maxCookMinutes
}

// Random jitter keeps regenerated plans different; preferences nudge the ranking.
function score(meal: Meal, prefs: Preferences, favoriteIds: string[], recent: Set<string>): number {
  let value = Math.random()
  if (meal.categorySlug && prefs.proteinLikes.includes(meal.categorySlug)) value += 2
  if (favoriteIds.includes(meal.id)) value += 1
  if (recent.has(meal.id)) value -= 3
  return value
}

// Meals to avoid repeating: this week's plan about to be replaced, last week's plan, and recently cooked meals.
function recentMeals(): Set<string> {
  const cutoff = Date.now() - REPEAT_DAYS * 24 * 60 * 60 * 1000
  const cooked = useMealActivity().cookedSince(cutoff)
  return new Set([...Object.values(usePlanner().state.plan).flat(), ...listPreviousWeekMeals(weekStart()), ...cooked])
}

export function generatePlan(): Plan {
  const prefs = usePreferences().state
  const disliked = new Set(useMealActivity().state.disliked)
  const favoriteIds = useFavorites().state.ids

  const days = [...prefs.cookingDays].sort((a, b) => a - b)
  if (!days.length) return {}

  const recent = recentMeals()
  const eligible = (enforceTime: boolean) => getMeals().filter((meal) => !disliked.has(meal.id) && isEligible(meal, prefs, enforceTime))

  // Relax the time limit when too few meals qualify.
  let pool = eligible(true)
  if (pool.length < days.length) pool = eligible(false)

  const ranked = pool
    .map((meal) => ({ meal, value: score(meal, prefs, favoriteIds, recent) }))
    .sort((a, b) => b.value - a.value)
    .map((entry) => entry.meal)

  // Prefer variety: at most two meals from the same category.
  const picked: Meal[] = []
  const perCategory = new Map<string, number>()
  for (const meal of ranked) {
    if (picked.length >= days.length) break
    const key = meal.categorySlug ?? 'other'
    if ((perCategory.get(key) ?? 0) >= 2) continue
    picked.push(meal)
    perCategory.set(key, (perCategory.get(key) ?? 0) + 1)
  }
  for (const meal of ranked) {
    if (picked.length >= days.length) break
    if (!picked.includes(meal)) picked.push(meal)
  }

  // Swap the priciest meal for a cheaper one until the plan fits the weekly budget (best effort).
  const total = () => picked.reduce((sum, meal) => sum + mealCost(meal.id, prefs.householdSize), 0)
  for (let attempt = 0; attempt < 12 && total() > prefs.weeklyBudget; attempt++) {
    const priciest = picked.reduce((best, meal, index) => (mealCost(meal.id, 1) > mealCost(picked[best]!.id, 1) ? index : best), 0)
    const cheaper = ranked.find((meal) => !picked.includes(meal) && mealCost(meal.id, 1) < mealCost(picked[priciest]!.id, 1))
    if (!cheaper) break
    picked[priciest] = cheaper
  }

  const plan: Plan = {}
  days.slice(0, picked.length).forEach((day, index) => {
    plan[day] = [picked[index]!.id]
  })
  return plan
}

export function regeneratePlan() {
  usePlanner().applyGeneratedPlan(generatePlan())
}

// Replacement options for a planned meal, best first.
export function swapCandidates(currentMealId: string, limit = 8): Meal[] {
  const prefs = usePreferences().state
  const planned = new Set(Object.values(usePlanner().state.plan).flat())
  const disliked = new Set(useMealActivity().state.disliked)
  const favoriteIds = useFavorites().state.ids

  return getMeals()
    .filter((meal) => meal.id !== currentMealId && !planned.has(meal.id) && !disliked.has(meal.id) && isEligible(meal, prefs, false))
    .map((meal) => ({ meal, value: score(meal, prefs, favoriteIds, new Set()) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((entry) => entry.meal)
}
