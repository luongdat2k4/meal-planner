import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'home',
    component: () => import('./HomeView.vue'),
    meta: { title: 'nav.home', hideHeader: true, tab: { label: 'nav.home', icon: ICONS.home, order: 1 } },
  },
]
