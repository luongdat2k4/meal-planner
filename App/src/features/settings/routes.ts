import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./SettingsView.vue'),
    meta: { title: 'Cài đặt', tab: { label: 'Cài đặt', icon: ICONS.cog, order: 5 } },
  },
]
