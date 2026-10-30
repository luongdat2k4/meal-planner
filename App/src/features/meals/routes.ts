import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const mealsRoutes: RouteRecordRaw[] = [
  {
    path: '/meals',
    name: 'meals',
    component: () => import('./MealsView.vue'),
    meta: { title: 'Món ăn', tab: { label: 'Món ăn', icon: ICONS.silverware, order: 3 } },
  },
  {
    path: '/meals/:id',
    name: 'meal-detail',
    component: () => import('./MealDetailView.vue'),
    props: true,
    meta: { title: 'Chi tiết món', fullscreen: true },
  },
]
