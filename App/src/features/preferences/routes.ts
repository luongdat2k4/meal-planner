import type { RouteRecordRaw } from 'vue-router'

export const preferencesRoutes: RouteRecordRaw[] = [
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('./OnboardingView.vue'),
    meta: { title: 'Làm quen', fullscreen: true },
  },
  {
    path: '/preferences',
    name: 'preferences',
    component: () => import('./PreferencesView.vue'),
    meta: { title: 'Sở thích ăn uống', backTo: { name: 'settings' } },
  },
]
