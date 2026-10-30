import { ref, watch } from 'vue'
import en from './languages/en.json'
import vn from './languages/vn.json'

// Catalog text exists in two languages (public/i18n/<lang>.json, columns of the `language` table).
export type Lang = 'vn' | 'en'

// `flag` is the file name (without .svg) in public/asset/flag.
export const languages: { id: Lang; label: string; flag: string }[] = [
  { id: 'vn', label: 'Tiếng Việt', flag: 'vi' },
  { id: 'en', label: 'English', flag: 'en' },
]

export const flagSrc = (id: Lang) =>
  `${import.meta.env.BASE_URL}asset/flag/${languages.find((option) => option.id === id)?.flag ?? id}.svg`

const KEY = 'meal-planner:lang'

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'vn' || stored === 'en') return stored
  } catch {
    // Storage can be unavailable; use the default.
  }
  // No saved choice yet: Vietnamese for Vietnamese devices, English for any other language.
  const device = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : ''
  return device && !device.startsWith('vi') ? 'en' : 'vn'
}

export const lang = ref<Lang>(initialLang())

// Saves the current language. Also called when the user confirms the language the app already shows.
export function saveLang() {
  try {
    localStorage.setItem(KEY, lang.value)
  } catch {
    // Keep working in memory.
  }
}

watch(lang, saveLang)

// ---- UI text. Catalog text (meals, ingredients, ...) comes from public/i18n through backend/catalogText.


const dictionaries: Record<Lang, unknown> = { vn, en }

function lookup(source: unknown, key: string): string | undefined {
  let node = source
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

/**
 * Text of the interface in the current language, from shared/languages/<lang>.json.
 * Keys are dotted paths ("settings.title"); `{name}` placeholders are filled from `params`.
 * Falls back to the other language, then to the key itself. Reading `lang` keeps templates reactive.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const other: Lang = lang.value === 'vn' ? 'en' : 'vn'
  const text = lookup(dictionaries[lang.value], key) ?? lookup(dictionaries[other], key) ?? key
  return params ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : text
}
