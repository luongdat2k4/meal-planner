import { computed } from 'vue'
import { dataVersion } from '../../backend/database'
import { listActivity, patchActivity, setMealDisliked } from '../../backend/runtime'

const MAX_RECENT = 12

// meal_activity rows, re-read whenever the runtime database changes.
const rows = computed(() => {
  void dataVersion.value
  return listActivity()
})

const ratings = computed(() => Object.fromEntries(rows.value.flatMap((r) => (r.rating ? [[r.mealSlug, r.rating]] : []))))
const notes = computed(() => Object.fromEntries(rows.value.flatMap((r) => (r.note ? [[r.mealSlug, r.note]] : []))))
const cooked = computed(() => new Set(rows.value.filter((r) => r.lastCookedAt).map((r) => r.mealSlug)))
const disliked = computed(() => new Set(rows.value.filter((r) => r.isDisliked).map((r) => r.mealSlug)))
// Most recently viewed meal slugs, newest first.
const recent = computed(() =>
  rows.value
    .filter((r) => r.lastViewedAt)
    .sort((a, b) => (b.lastViewedAt ?? '').localeCompare(a.lastViewedAt ?? ''))
    .slice(0, MAX_RECENT)
    .map((r) => r.mealSlug),
)

const state = {
  get ratings(): Record<string, number> {
    return ratings.value
  },
  get notes(): Record<string, string> {
    return notes.value
  },
  get recent(): string[] {
    return recent.value
  },
  get disliked(): string[] {
    return [...disliked.value]
  },
}

export function useMealActivity() {
  const isCooked = (id: string) => cooked.value.has(id)
  const isDisliked = (id: string) => disliked.value.has(id)

  // Slugs of meals cooked at or after `sinceMs` (epoch milliseconds).
  const cookedSince = (sinceMs: number) =>
    rows.value.filter((r) => r.lastCookedAt && Date.parse(r.lastCookedAt) >= sinceMs).map((r) => r.mealSlug)

  const setRating = (id: string, value: number) => patchActivity(id, { rating: value > 0 ? value : null })
  const setNote = (id: string, text: string) => patchActivity(id, { note: text.trim() ? text : null })
  const toggleCooked = (id: string) => patchActivity(id, { lastCookedAt: isCooked(id) ? null : new Date().toISOString() })
  const toggleDisliked = (id: string) => setMealDisliked(id, !isDisliked(id))
  const markViewed = (id: string) => patchActivity(id, { lastViewedAt: new Date().toISOString() })

  return { state, isCooked, cookedSince, isDisliked, setRating, setNote, toggleCooked, toggleDisliked, markViewed }
}
