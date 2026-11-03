import { ref, watch } from 'vue'
import en from './languages/en.json'
import vn from './languages/vn.json'
import ar from './languages/ar.json'
import bn from './languages/bn.json'
import de from './languages/de.json'
import es from './languages/es.json'
import fr from './languages/fr.json'
import hi from './languages/hi.json'
import id_ from './languages/id_.json'
import it from './languages/it.json'
import ja from './languages/ja.json'
import ko from './languages/ko.json'
import nl from './languages/nl.json'
import pl from './languages/pl.json'
import pt from './languages/pt.json'
import ru from './languages/ru.json'
import th from './languages/th.json'
import tr from './languages/tr.json'
import ur from './languages/ur.json'
import zh from './languages/zh.json'

// Catalog text exists in every language below (public/i18n/<lang>.json, columns of the `language` table).
// `id_` is Indonesian: the column is not called `id` because that is the table's key.
export type Lang = 'vn' | 'en' | 'ar' | 'bn' | 'de' | 'es' | 'fr' | 'hi' | 'id_' | 'it' | 'ja' | 'ko' | 'nl' | 'pl' | 'pt' | 'ru' | 'th' | 'tr' | 'ur' | 'zh'

// `flag` is the file name (without .svg) in public/asset/flag, `device` the language prefix of navigator.language.
// `hour12` is how times are read in that country: 7:30 PM (true) or 19:30 (false).
export const languages: { id: Lang; label: string; flag: string; device: string; hour12: boolean }[] = [
  { id: 'vn', label: 'Tiếng Việt', flag: 'vi', device: 'vi', hour12: false },
  { id: 'en', label: 'English', flag: 'en', device: 'en', hour12: true },
  { id: 'ar', label: 'العربية', flag: 'ar', device: 'ar', hour12: true },
  { id: 'bn', label: 'বাংলা', flag: 'bn', device: 'bn', hour12: true },
  { id: 'de', label: 'Deutsch', flag: 'de', device: 'de', hour12: false },
  { id: 'es', label: 'Español', flag: 'es', device: 'es', hour12: false },
  { id: 'fr', label: 'Français', flag: 'fr', device: 'fr', hour12: false },
  { id: 'hi', label: 'हिन्दी', flag: 'hi', device: 'hi', hour12: true },
  { id: 'id_', label: 'Bahasa Indonesia', flag: 'id', device: 'id', hour12: false },
  { id: 'it', label: 'Italiano', flag: 'it', device: 'it', hour12: false },
  { id: 'ja', label: '日本語', flag: 'ja', device: 'ja', hour12: false },
  { id: 'ko', label: '한국어', flag: 'ko', device: 'ko', hour12: true },
  { id: 'nl', label: 'Nederlands', flag: 'nl', device: 'nl', hour12: false },
  { id: 'pl', label: 'Polski', flag: 'pl', device: 'pl', hour12: false },
  { id: 'pt', label: 'Português', flag: 'pt', device: 'pt', hour12: false },
  { id: 'ru', label: 'Русский', flag: 'ru', device: 'ru', hour12: false },
  { id: 'th', label: 'ไทย', flag: 'th', device: 'th', hour12: false },
  { id: 'tr', label: 'Türkçe', flag: 'tr', device: 'tr', hour12: false },
  { id: 'ur', label: 'اردو', flag: 'ur', device: 'ur', hour12: true },
  { id: 'zh', label: '中文', flag: 'zh', device: 'zh', hour12: false },
]

export const flagSrc = (id: Lang) =>
  `${import.meta.env.BASE_URL}asset/flag/${languages.find((option) => option.id === id)?.flag ?? id}.svg`

const KEY = 'meal-planner:lang'

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY)
    const known = languages.find((option) => option.id === stored)
    if (known) return known.id
  } catch {
    // Storage can be unavailable; use the default.
  }
  // No saved choice yet: the device's language when the app has it, otherwise English (Vietnamese when unknown).
  const device = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : ''
  if (!device) return 'vn'
  return languages.find((option) => device.startsWith(option.device))?.id ?? 'en'
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

// Tells the browser the page language (the layout is not mirrored for right-to-left scripts).
function applyDirection() {
  if (typeof document === 'undefined') return
  const current = languages.find((option) => option.id === lang.value)
  document.documentElement.lang = current?.device ?? 'en'
}

watch(lang, () => {
  saveLang()
  applyDirection()
})
applyDirection()

// ---- UI text. Catalog text (meals, ingredients, ...) comes from public/i18n through backend/catalogText.


const dictionaries: Record<Lang, unknown> = { vn, en, ar, bn, de, es, fr, hi, id_, it, ja, ko, nl, pl, pt, ru, th, tr, ur, zh }

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
 * Falls back to English, then to the key itself. Reading `lang` keeps templates reactive.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const text = lookup(dictionaries[lang.value], key) ?? lookup(en, key) ?? key
  return params ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : text
}
