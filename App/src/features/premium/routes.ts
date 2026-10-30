import type { RouteRecordRaw } from 'vue-router'

export const premiumRoutes: RouteRecordRaw[] = [
  {
    path: '/premium',
    name: 'premium',
    component: () => import('./PremiumView.vue'),
    meta: { title: 'Premium', fullscreen: true },
  },
]
