import mealsJson from './data/meals.json'
import type { Meal } from './types'

export const MEALS: Meal[] = mealsJson

const MEAL_BY_ID = new Map(MEALS.map((meal) => [meal.id, meal]))

export const getMeal = (id: string): Meal | undefined => MEAL_BY_ID.get(id)
