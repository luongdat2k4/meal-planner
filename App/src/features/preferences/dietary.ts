import { text } from '../../backend/catalogText'
import type { Dietary } from './types'

// Dietary slugs used by meal.dietary; names come from the i18n files, icons from the scraped images.
const dietary = (id: string): Dietary => ({
  id,
  icon: `images/assets_dietary_${id}.png`,
  get name() {
    return text(id)
  },
})

export const DIETARY: Dietary[] = ['dairyfree', 'glutenfree', 'pescatarian', 'sesamefree'].map(dietary)
