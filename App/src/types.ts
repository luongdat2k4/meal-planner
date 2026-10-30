export interface Meal {
  id: string
  title: string
  image: string
}

export interface Ingredient {
  id: string
  name: string
  image: string
}

export interface Store {
  id: string
  name: string
  logo: string
}

export interface Dietary {
  id: string
  name: string
  icon: string
}

export interface ShoppingItem {
  id: string
  label: string
  checked: boolean
}

export const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'] as const
