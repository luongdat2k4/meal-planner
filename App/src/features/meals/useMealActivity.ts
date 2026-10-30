import { createPersistedState } from '../../shared/persisted'

interface ActivityState {
  ratings: Record<string, number>
  notes: Record<string, string>
  cooked: string[]
  disliked: string[]
  // Most recently viewed meal ids, newest first.
  recent: string[]
}

const MAX_RECENT = 12

const state = createPersistedState<ActivityState>('meal-planner:activity', () => ({
  ratings: {},
  notes: {},
  cooked: [],
  disliked: [],
  recent: [],
}))

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id])

export function useMealActivity() {
  const isCooked = (id: string) => state.cooked.includes(id)
  const isDisliked = (id: string) => state.disliked.includes(id)

  function setRating(id: string, value: number) {
    if (value <= 0) delete state.ratings[id]
    else state.ratings[id] = value
  }

  function setNote(id: string, text: string) {
    if (text.trim()) state.notes[id] = text
    else delete state.notes[id]
  }

  function toggleCooked(id: string) {
    state.cooked = toggleIn(state.cooked, id)
  }

  function toggleDisliked(id: string) {
    state.disliked = toggleIn(state.disliked, id)
  }

  function markViewed(id: string) {
    state.recent = [id, ...state.recent.filter((value) => value !== id)].slice(0, MAX_RECENT)
  }

  function reset() {
    state.ratings = {}
    state.notes = {}
    state.cooked = []
    state.disliked = []
    state.recent = []
  }

  return { state, isCooked, isDisliked, setRating, setNote, toggleCooked, toggleDisliked, markViewed, reset }
}
