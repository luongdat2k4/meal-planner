// Image paths in the catalog JSON are relative to the public folder.
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}

// Meal and ingredient photos have a small WebP copy in images/thumbnails (made by scripts/make-thumbnails.py).
// Lists and cards use it: decoding the 1024px original for every card is what made phones drop frames.
const THUMBNAILED = ['assets_meals_', 'assets_ingredients_']

export function thumbUrl(path: string): string {
  const match = /^images\/([^/]+)\.(?:jpe?g|png)$/i.exec(path)
  if (!match || !THUMBNAILED.some((prefix) => match[1]!.startsWith(prefix))) return assetUrl(path)
  return assetUrl(`images/thumbnails/${match[1]}.webp`)
}
