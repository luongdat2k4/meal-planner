import { MEALS } from './meals'

export interface MealCategory {
  id: string
  label: string
  emoji: string
  // Regex sources matched at a word start against the meal title.
  keywords: string[]
}

// Order matters: the first match is the badge shown on a meal card.
export const MEAL_CATEGORIES: MealCategory[] = [
  { id: 'airfryer', label: 'Air fryer', emoji: '🍟', keywords: ['air ?fr'] },
  { id: 'chicken', label: 'Gà', emoji: '🍗', keywords: ['chicken'] },
  { id: 'beef', label: 'Bò', emoji: '🥩', keywords: ['beef', 'steak', 'burger'] },
  { id: 'pork', label: 'Heo', emoji: '🥓', keywords: ['pork', 'sausage', 'bacon', 'ham\\b', 'chorizo', 'gammon'] },
  {
    id: 'seafood',
    label: 'Hải sản',
    emoji: '🐟',
    keywords: ['salmon', 'prawn', 'fish', 'cod\\b', 'tuna', 'shrimp', 'mackerel', 'scallop', 'mussel', 'anchov'],
  },
  {
    id: 'veg',
    label: 'Rau & đậu',
    emoji: '🥦',
    keywords: ['tofu', 'bean', 'chickpea', 'halloumi', 'veg', 'lentil', 'mushroom', 'paneer', 'falafel', 'cauliflower', 'aubergine', 'courgette'],
  },
  {
    id: 'pasta',
    label: 'Pasta & mì',
    emoji: '🍝',
    keywords: ['pasta', 'spaghetti', 'linguine', 'gnocchi', 'penne', 'noodle', 'lasagne', 'macaroni', 'mac\\b', 'tortelloni', 'rigatoni', 'farfalle', 'orzo', 'fusilli', 'udon', 'ramen', 'tagliatelle'],
  },
]

const matchers = MEAL_CATEGORIES.map((category) => ({
  category,
  pattern: new RegExp(`\\b(?:${category.keywords.join('|')})`, 'i'),
}))

const CATEGORIES_BY_MEAL = new Map(
  MEALS.map((meal) => [meal.id, matchers.filter((m) => m.pattern.test(meal.title)).map((m) => m.category)]),
)

export function mealCategories(mealId: string): MealCategory[] {
  return CATEGORIES_BY_MEAL.get(mealId) ?? []
}
