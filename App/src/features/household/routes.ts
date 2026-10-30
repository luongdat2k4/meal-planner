import type { RouteRecordRaw } from 'vue-router'

export const householdRoutes: RouteRecordRaw[] = [
  {
    path: '/household',
    name: 'household',
    component: () => import('./HouseholdView.vue'),
    meta: { title: 'Gia đình', backTo: { name: 'settings' } },
  },
]
