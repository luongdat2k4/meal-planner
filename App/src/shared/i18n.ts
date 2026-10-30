import { ref, watch } from 'vue'

// Catalog text exists in two languages (public/i18n/<lang>.json, columns of the `language` table).
export type Lang = 'vn' | 'en'

export const languages: { id: Lang; label: string }[] = [
  { id: 'vn', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
]

const KEY = 'meal-planner:lang'

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'vn' || stored === 'en') return stored
  } catch {
    // Storage can be unavailable; use the default.
  }
  return 'vn'
}

export const lang = ref<Lang>(initialLang())

watch(lang, (value) => {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // Keep working in memory.
  }
})
