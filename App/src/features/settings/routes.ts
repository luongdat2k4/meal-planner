import type { RouteRecordRaw } from 'vue-router'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./SettingsView.vue'),
    meta: { title: 'nav.settings', backTo: { name: 'home' } },
  },
  {
    path: '/settings/language',
    name: 'settings-language',
    component: () => import('./LanguageView.vue'),
    meta: { title: 'nav.language', backTo: { name: 'settings' } },
  },
]
