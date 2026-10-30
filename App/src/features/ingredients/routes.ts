import type { RouteRecordRaw } from 'vue-router'

export const ingredientsRoutes: RouteRecordRaw[] = [
  {
    path: '/ingredients',
    name: 'ingredients',
    component: () => import('./IngredientsView.vue'),
    meta: { title: 'nav.ingredients', backTo: { name: 'shopping' } },
  },
]
