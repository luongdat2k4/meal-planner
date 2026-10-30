import { reactive, watch } from 'vue'
import type { ShoppingItem } from '../types'

interface AppState {
  // Day index (0 = Monday) -> meal ids planned for that day.
  plan: Record<number, string[]>
  shopping: ShoppingItem[]
  storeId: string | null
}

const STORAGE_KEY = 'meal-planner:v1'

function defaults(): AppState {
  return { plan: {}, shopping: [], storeId: null }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults()
  } catch {
    return defaults()
  }
}

const state = reactive<AppState>(load())

watch(
  state,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Storage can be unavailable (private mode, blocked site data); keep working in memory.
    }
  },
  { deep: true },
)

export function useStore() {
  function addMealToDay(day: number, mealId: string) {
    const list = state.plan[day] ?? []
    state.plan[day] = [...list, mealId]
  }

  function removeMealFromDay(day: number, index: number) {
    state.plan[day] = (state.plan[day] ?? []).filter((_, i) => i !== index)
  }

  function clearDay(day: number) {
    state.plan[day] = []
  }

  function addShoppingItem(label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    state.shopping.push({ id: crypto.randomUUID(), label: trimmed, checked: false })
  }

  function toggleShoppingItem(id: string) {
    const item = state.shopping.find((i) => i.id === id)
    if (item) item.checked = !item.checked
  }

  function removeShoppingItem(id: string) {
    state.shopping = state.shopping.filter((i) => i.id !== id)
  }

  function clearCheckedItems() {
    state.shopping = state.shopping.filter((i) => !i.checked)
  }

  function setStore(id: string | null) {
    state.storeId = id
  }

  function resetAll() {
    Object.assign(state, defaults())
  }

  return {
    state,
    addMealToDay,
    removeMealFromDay,
    clearDay,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearCheckedItems,
    setStore,
    resetAll,
  }
}
