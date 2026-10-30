import { createPersistedState } from '../../shared/persisted'
import type { ShoppingItem } from './types'

interface ShoppingState {
  items: ShoppingItem[]
  storeId: string | null
}

const state = createPersistedState<ShoppingState>('meal-planner:shopping', () => ({ items: [], storeId: null }))

export function useShopping() {
  function addShoppingItem(label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    state.items.push({ id: crypto.randomUUID(), label: trimmed, checked: false })
  }

  // Adds labels that are not already on the list; returns how many were new.
  function addManyShoppingItems(labels: string[]): number {
    const existing = new Set(state.items.filter((item) => !item.checked).map((item) => item.label.toLowerCase()))
    let added = 0
    for (const label of labels) {
      const trimmed = label.trim()
      if (!trimmed || existing.has(trimmed.toLowerCase())) continue
      existing.add(trimmed.toLowerCase())
      state.items.push({ id: crypto.randomUUID(), label: trimmed, checked: false })
      added++
    }
    return added
  }

  function toggleShoppingItem(id: string) {
    const item = state.items.find((i) => i.id === id)
    if (item) item.checked = !item.checked
  }

  function removeShoppingItem(id: string) {
    state.items = state.items.filter((i) => i.id !== id)
  }

  function clearCheckedItems() {
    state.items = state.items.filter((i) => !i.checked)
  }

  function setStore(id: string | null) {
    state.storeId = id
  }

  function reset() {
    state.items = []
    state.storeId = null
  }

  return { state, addShoppingItem, addManyShoppingItems, toggleShoppingItem, removeShoppingItem, clearCheckedItems, setStore, reset }
}
