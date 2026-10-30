import { MEAL_CATEGORIES } from '../meals'

// Ids match the allergen ids produced by the mock recipes.
export const ALLERGENS = [
  { id: 'milk', label: 'Sữa', emoji: '🥛' },
  { id: 'egg', label: 'Trứng', emoji: '🥚' },
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'soy', label: 'Đậu nành', emoji: '🫘' },
  { id: 'peanut', label: 'Đậu phộng', emoji: '🥜' },
  { id: 'nuts', label: 'Hạt cây', emoji: '🌰' },
  { id: 'shellfish', label: 'Hải sản có vỏ', emoji: '🦐' },
  { id: 'fish', label: 'Cá', emoji: '🐟' },
  { id: 'sesame', label: 'Mè', emoji: '⚪' },
]

export const DIET_LABELS: Record<string, string> = {
  dairyfree: 'Không sữa',
  glutenfree: 'Không gluten',
  pescatarian: 'Ăn chay có cá',
  sesamefree: 'Không mè',
}

const PROTEIN_IDS = ['chicken', 'beef', 'pork', 'seafood', 'veg']
export const PROTEIN_OPTIONS = MEAL_CATEGORIES.filter((category) => PROTEIN_IDS.includes(category.id))

export const COOK_TIME_OPTIONS = [
  { id: '15', label: '≤ 15 phút' },
  { id: '30', label: '≤ 30 phút' },
  { id: '45', label: '≤ 45 phút' },
  { id: '60', label: '≤ 1 giờ' },
  { id: '90', label: 'Không giới hạn' },
]

export const BUDGET = { min: 300_000, max: 3_000_000, step: 100_000 }
