import type { RouteRecordRaw } from 'vue-router'

export const onboardingRoutes: RouteRecordRaw[] = [
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('./OnboardingView.vue'),
    meta: { title: 'Giới thiệu', fullscreen: true },
  },
]
