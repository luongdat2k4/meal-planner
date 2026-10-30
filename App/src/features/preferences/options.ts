import { text } from '../../backend/catalogText'
import { t } from '../../shared/i18n'
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

export const getCookTimeOptions = () => [
  { id: '15', label: t('preferences.cookTime.15') },
  { id: '30', label: t('preferences.cookTime.30') },
  { id: '45', label: t('preferences.cookTime.45') },
  { id: '60', label: t('preferences.cookTime.60') },
  { id: '90', label: t('preferences.cookTime.90') },
]

export const BUDGET = { min: 300_000, max: 3_000_000, step: 100_000 }
