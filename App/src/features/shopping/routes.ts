import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const shoppingRoutes: RouteRecordRaw[] = [
  {
    path: '/shopping',
    name: 'shopping',
    component: () => import('./ShoppingView.vue'),
    meta: { title: 'Danh sách đi chợ', tab: { label: 'Đi chợ', icon: ICONS.cart, order: 4 } },
  },
]
