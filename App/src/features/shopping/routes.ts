import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const shoppingRoutes: RouteRecordRaw[] = [
  {
    path: '/shopping',
    name: 'shopping',
    component: () => import('./ShoppingView.vue'),
    meta: { title: 'nav.shopping', statusBar: '#d2f0f5', tab: { label: 'nav.shoppingTab', icon: ICONS.cart, order: 4 } },
  },
]
