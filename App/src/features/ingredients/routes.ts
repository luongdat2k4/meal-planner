import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const ingredientsRoutes: RouteRecordRaw[] = [
  {
    path: '/ingredients',
    name: 'ingredients',
    component: () => import('./IngredientsView.vue'),
    meta: { title: 'Nguyên liệu', tab: { label: 'Nguyên liệu', icon: ICONS.carrot, order: 3 } },
  },
]
