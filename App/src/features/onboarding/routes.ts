import type { RouteRecordRaw } from 'vue-router'

export const onboardingRoutes: RouteRecordRaw[] = [
  {
    path: '/onboarding/language',
    name: 'welcome-language',
    component: () => import('./LanguageStepView.vue'),
    meta: { title: 'nav.language', fullscreen: true },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('./OnboardingView.vue'),
    meta: { title: 'nav.onboarding', fullscreen: true },
  },
]
