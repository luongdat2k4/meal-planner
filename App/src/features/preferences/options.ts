import { text } from '../../backend/catalogText'
import { getMealCategories, type MealCategory } from '../meals'

export interface Allergen {
  // Allergen slug; also the key of its translated name.
  id: string
  emoji: string
  readonly label: string
}

const allergen = (id: string, emoji: string): Allergen => ({
  id,
  emoji,
  get label() {
    return text(id)
  },
})

export const ALLERGENS: Allergen[] = [
  allergen('milk', '🥛'),
  allergen('egg', '🥚'),
  allergen('gluten', '🌾'),
  allergen('soy', '🫘'),
  allergen('peanut', '🥜'),
  allergen('nuts', '🌰'),
  allergen('shellfish', '🦐'),
  allergen('fish', '🐟'),
  allergen('sesame', '⚪'),
]

const PROTEIN_IDS = ['chicken', 'beef', 'pork', 'seafood', 'veg']
export const getProteinOptions = (): MealCategory[] => getMealCategories().filter((category) => PROTEIN_IDS.includes(category.id))

export const COOK_TIME_OPTIONS = [
  { id: '15', label: '≤ 15 phút' },
  { id: '30', label: '≤ 30 phút' },
  { id: '45', label: '≤ 45 phút' },
  { id: '60', label: '≤ 1 giờ' },
  { id: '90', label: 'Không giới hạn' },
]

export const BUDGET = { min: 300_000, max: 3_000_000, step: 100_000 }
