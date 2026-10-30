import type { RouteRecordRaw } from 'vue-router'

export const preferencesRoutes: RouteRecordRaw[] = [
  {
    path: '/setup',
    name: 'setup',
    component: () => import('./SetupView.vue'),
    meta: { title: 'nav.setup', fullscreen: true },
  },
  {
    path: '/preferences',
    name: 'preferences',
    component: () => import('./PreferencesView.vue'),
    meta: { title: 'nav.preferences', backTo: { name: 'settings' } },
  },
]
