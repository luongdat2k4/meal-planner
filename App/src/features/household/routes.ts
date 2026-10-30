import type { RouteRecordRaw } from 'vue-router'

export const householdRoutes: RouteRecordRaw[] = [
  {
    path: '/household',
    name: 'household',
    component: () => import('./HouseholdView.vue'),
    meta: { title: 'nav.household', backTo: { name: 'settings' } },
  },
]
