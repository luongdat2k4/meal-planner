import { reactive, watch } from 'vue'

// Reactive state mirrored to localStorage under `key`.
export function createPersistedState<T extends object>(key: string, defaults: () => T): T {
  function load(): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults()
    } catch {
      return defaults()
    }
  }

  const state = reactive<object>(load()) as T

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Storage can be unavailable (private mode, blocked site data); keep working in memory.
      }
    },
    { deep: true },
  )

  return state
}
