import { shallowRef, watch } from 'vue'
import { lang, type Lang } from '../shared/i18n'

// Catalog text lives in public/i18n/<lang>.json as one object per slug, e.g.
// { "steak": { "title": "Steak", "step": { "oven": { "3": "..." } } }, "chicken": { "title": "Chicken" } }.
const base = import.meta.env.BASE_URL
type CatalogStrings = { [segment: string]: string | CatalogStrings }
const strings = shallowRef<Partial<Record<Lang, CatalogStrings>>>({})
const pending = new Map<Lang, Promise<void>>()

export async function loadCatalogText(languages: Lang[]) {
  await Promise.all(
    [...new Set(languages)].map((id) => {
      if (strings.value[id]) return Promise.resolve()
      const existing = pending.get(id)
      if (existing) return existing
      const task = loadOne(id).finally(() => pending.delete(id))
      pending.set(id, task)
      return task
    }),
  )
}

async function loadOne(id: Lang) {
  let catalog: CatalogStrings = {}
  try {
    const response = await fetch(`${base}i18n/${id}.json`, { cache: 'no-cache' })
    if (response.ok) catalog = (await response.json()) as CatalogStrings
  } catch {
    // Keep the empty catalog; text() falls back to the other language, then to the key.
  }
  strings.value = { ...strings.value, [id]: catalog }
}

watch(lang, (id) => {
  void loadCatalogText([id])
})

function lookup(source: CatalogStrings | undefined, path: string[]): string | undefined {
  let node: string | CatalogStrings | undefined = source
  for (const segment of path) {
    if (!node || typeof node === 'string') return undefined
    node = node[segment]
  }
  return typeof node === 'string' ? node : undefined
}

function translate(path: string[]): string | undefined {
  // Reading `lang` here keeps templates reactive to the language switch.
  const fallback: Lang = lang.value === 'vn' ? 'en' : 'vn'
  return lookup(strings.value[lang.value], path) ?? lookup(strings.value[fallback], path)
}

/** Name of a meal, ingredient, category, dietary, allergen, unit or ingredient section: `language.key = slug`. */
export function text(slug: string): string {
  return translate([slug, 'title']) ?? slug
}

/** Cooking step `<slug>.step.<method>.<n>`. */
export function stepText(slug: string, method: string, n: number): string {
  return translate([slug, 'step', method, String(n)]) ?? `${slug}.step.${method}.${n}`
}
