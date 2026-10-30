import { createPersistedState } from '../../shared/persisted'

interface FavoritesState {
  ids: string[]
}

const state = createPersistedState<FavoritesState>('meal-planner:favorites', () => ({ ids: [] }))

export function useFavorites() {
  const isFavorite = (id: string) => state.ids.includes(id)

  function toggleFavorite(id: string) {
    state.ids = isFavorite(id) ? state.ids.filter((i) => i !== id) : [...state.ids, id]
  }

  function reset() {
    state.ids = []
  }

  return { state, isFavorite, toggleFavorite, reset }
}
