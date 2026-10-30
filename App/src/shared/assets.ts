// Image paths in the catalog JSON are relative to the public folder.
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}
