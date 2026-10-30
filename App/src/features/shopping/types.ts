export interface ShoppingItem {
  id: string
  // What the list shows: the typed text, or the ingredient name with its quantity.
  readonly label: string
  checked: boolean
  // Set when the item comes from an ingredient; hand-typed items have none.
  ingredientSlug: string | null
  image: string | null
}

export interface Store {
  id: string
  name: string
  logo: string
}
