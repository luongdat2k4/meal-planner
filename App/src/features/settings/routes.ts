import type { RouteRecordRaw } from 'vue-router'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./SettingsView.vue'),
    meta: { title: 'nav.settings', backTo: { name: 'home' }, ads: { banner: true } },
  },
  {
    path: '/settings/language',
    name: 'settings-language',
    component: () => import('./LanguageView.vue'),
    meta: { title: 'nav.language', backTo: { name: 'settings' }, ads: { banner: true } },
  },
  {
    path: '/settings/reminder',
    name: 'settings-reminder',
    component: () => import('./ReminderView.vue'),
    meta: { title: 'nav.reminder', backTo: { name: 'settings' } },
  },
]
