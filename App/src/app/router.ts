import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { homeRoutes } from '../features/home/routes'
import { ingredientsRoutes } from '../features/ingredients/routes'
import { mealsRoutes } from '../features/meals/routes'
import { onboardingRoutes } from '../features/onboarding/routes'
import { plannerRoutes } from '../features/planner/routes'
import { usePreferences } from '../features/preferences'
import { preferencesRoutes } from '../features/preferences/routes'
import { settingsRoutes } from '../features/settings/routes'
import { shoppingRoutes } from '../features/shopping/routes'

const featureRoutes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...mealsRoutes,
  ...plannerRoutes,
  ...ingredientsRoutes,
  ...shoppingRoutes,
  ...settingsRoutes,
  ...preferencesRoutes,
  ...onboardingRoutes,
]

// Clean URLs need the server (Vite, Capacitor's local server) to fall back to index.html for unknown paths.
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'home' } },
    ...featureRoutes,
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

// First run: language (/onboarding/language), welcome slides (/onboarding), preference questions (/setup),
// then the app.
router.beforeEach((to) => {
  const { state } = usePreferences()
  if (state.setupDone) {
    return to.name === 'welcome-language' || to.name === 'onboarding' || to.name === 'setup' ? { name: 'home' } : undefined
  }
  if (!state.languageChosen) return to.name === 'welcome-language' ? undefined : { name: 'welcome-language' }
  if (!state.onboardingSeen) return to.name === 'onboarding' ? undefined : { name: 'onboarding' }
  return to.name === 'setup' ? undefined : { name: 'setup' }
})

export const tabs = featureRoutes
  .flatMap((route) => (route.meta?.tab && typeof route.name === 'string' ? [{ name: route.name, ...route.meta.tab }] : []))
  .sort((a, b) => a.order - b.order)
