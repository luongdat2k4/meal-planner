import type { RouteRecordRaw } from 'vue-router'

export const preferencesRoutes: RouteRecordRaw[] = [
  {
    path: '/setup',
    name: 'setup',
    component: () => import('./SetupView.vue'),
    meta: { title: 'Thiết lập', fullscreen: true },
  },
  {
    path: '/preferences',
    name: 'preferences',
    component: () => import('./PreferencesView.vue'),
    meta: { title: 'Sở thích ăn uống', backTo: { name: 'settings' } },
  },
]
