export interface Ingredient {
  // The catalog slug; also the key of the ingredient's translated name.
  id: string
  readonly name: string
  image: string
}
