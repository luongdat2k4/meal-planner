import type { RouteRecordRaw } from 'vue-router'
import { ICONS } from '../../shared/icons'

export const plannerRoutes: RouteRecordRaw[] = [
  {
    path: '/planner',
    name: 'planner',
    component: () => import('./PlannerView.vue'),
    meta: { title: 'Kế hoạch tuần', tab: { label: 'Lịch', icon: ICONS.calendarWeek, order: 2 } },
  },
]
