import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'home',
    component: () => import('./HomeView.vue'),
    meta: { title: 'Trang chủ', hideHeader: true, tab: { label: 'Trang chủ', icon: ICONS.home, order: 1 } },
  },
]
