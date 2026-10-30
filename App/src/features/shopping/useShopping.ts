import { computed } from 'vue'
import { listIngredients } from '../../backend/catalog'
import { text } from '../../backend/catalogText'
import { dataVersion } from '../../backend/database'
import {
  deleteCheckedShopping,
  deleteShopping,
  importShopping,
  insertShopping,
  listShopping,
  setShoppingChecked,
  setShoppingStore,
  type ShoppingRow,
} from '../../backend/runtime'
import { weekStart } from '../../shared/date'
import { formatAmount } from '../../shared/format'
import { createPersistedState } from '../../shared/persisted'
import { planIngredients } from '../planner'
import type { ShoppingItem } from './types'

// shopping_item.store_id is per row, but the app picks one store for the whole list. The pick is kept here,
// so it survives an empty list, and is written onto every row.
const store = createPersistedState<{ storeId: string | null }>('meal-planner:shopping', () => ({ storeId: null }))

const rows = computed(() => {
  void dataVersion.value
  return listShopping()
})

const imageBySlug = computed(() => new Map(listIngredients().map((ingredient) => [ingredient.slug, ingredient.image])))

function toItem(row: ShoppingRow): ShoppingItem {
  return {
    id: row.id,
    checked: row.checked,
    ingredientSlug: row.ingredientSlug,
    image: row.ingredientSlug ? (imageBySlug.value.get(row.ingredientSlug) ?? null) : null,
    get label() {
      if (!row.ingredientSlug) return row.label
      const name = text(row.ingredientSlug)
      return row.quantity && row.unit ? `${name} · ${formatAmount(row.quantity, row.unit)}` : name
    },
  }
}

const items = computed(() => rows.value.map(toItem))

const state = {
  get items(): ShoppingItem[] {
    return items.value
  },
  get storeId(): string | null {
    return store.storeId
  },
}

export function useShopping() {
  // A hand-typed item.
  function addShoppingItem(label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    insertShopping({ weekStart: weekStart(), ingredientSlug: null, label: trimmed, quantity: null, unit: null, storeId: store.storeId })
  }

  // One ingredient, optionally with a quantity. Returns false when it is already on the list.
  function addIngredientItem(ingredientSlug: string, quantity: number | null = null, unit: string | null = null): boolean {
    if (quantity !== null && unit) {
      return importShopping([{ weekStart: weekStart(), ingredientSlug, quantity, unit, storeId: store.storeId }]) > 0
    }
    if (rows.value.some((row) => row.ingredientSlug === ingredientSlug && !row.checked && !row.unit)) return false
    insertShopping({ weekStart: weekStart(), ingredientSlug, label: '', quantity: null, unit: null, storeId: store.storeId })
    return true
  }

  // Several ingredients at once; returns how many were new.
  function addIngredientItems(lines: { ingredientSlug: string; quantity: number; unit: string }[]): number {
    return importShopping(lines.map((line) => ({ ...line, weekStart: weekStart(), storeId: store.storeId })))
  }

  // Gathers this week's plan into the list; lines already there are left as they are. Returns how many were new.
  function importFromPlan(): number {
    const { lines } = planIngredients()
    return addIngredientItems(lines)
  }

  const toggleShoppingItem = (id: string) => {
    const row = rows.value.find((r) => r.id === id)
    if (row) setShoppingChecked(id, !row.checked)
  }

  const removeShoppingItem = (id: string) => void deleteShopping(id)
  const clearCheckedItems = () => void deleteCheckedShopping()

  function setStore(id: string | null) {
    store.storeId = id
    setShoppingStore(id)
  }

  function reset() {
    store.storeId = null
  }

  return {
    state,
    addShoppingItem,
    addIngredientItem,
    addIngredientItems,
    importFromPlan,
    toggleShoppingItem,
    removeShoppingItem,
    clearCheckedItems,
    setStore,
    reset,
  }
}
