import { computed } from 'vue'
import { dataVersion } from '../../backend/database'
import { listActivity, patchActivity } from '../../backend/runtime'

// Saved meals are the meal_activity rows with is_saved = 1.
const saved = computed(() => {
  void dataVersion.value
  return listActivity()
    .filter((row) => row.isSaved)
    .map((row) => row.mealSlug)
})

const state = {
  get ids(): string[] {
    return saved.value
  },
}

export function useFavorites() {
  const isFavorite = (id: string) => saved.value.includes(id)
  const toggleFavorite = (id: string) => patchActivity(id, { isSaved: !isFavorite(id) })

  return { state, isFavorite, toggleFavorite }
}
