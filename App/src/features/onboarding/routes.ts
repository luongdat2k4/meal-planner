import type { RouteRecordRaw } from 'vue-router'

export const onboardingRoutes: RouteRecordRaw[] = [
  {
    path: '/begin',
    name: 'begin',
    component: () => import('./BeginView.vue'),
    meta: { title: 'nav.begin', fullscreen: true, ads: { banner: true } },
  },
  {
    path: '/onboarding/language',
    name: 'welcome-language',
    component: () => import('./LanguageStepView.vue'),
    meta: { title: 'nav.language', fullscreen: true, ads: { banner: true } },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('./OnboardingView.vue'),
    meta: { title: 'nav.onboarding', fullscreen: true, ads: { banner: true } },
  },
]
