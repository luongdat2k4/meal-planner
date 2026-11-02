import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { homeRoutes } from '../features/home/routes'
import { ingredientsRoutes } from '../features/ingredients/routes'
import { mealsRoutes } from '../features/meals/routes'
import { onboardingRoutes } from '../features/onboarding/routes'
import { plannerRoutes } from '../features/planner/routes'
import { Capacitor } from '@capacitor/core'
import { begin } from '../features/onboarding/begin'
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

// Opening the app again (setup done): /begin, then the app. First run: language (/onboarding/language), welcome slides (/onboarding), preference questions (/setup),
// then the app.
router.beforeEach((to) => {
  const { state } = usePreferences()
  // Setting the app up for the first time: this run never goes through /begin, not even once setup is finished.
  if (!state.setupDone) begin.done = true
  if (state.setupDone) {
    // Opening the app again: the launch screen (ads, then a short countdown) comes before the app. On the web it is
    // only reachable by its address, so reloading while developing does not pass through it.
    if (to.name === 'begin') return undefined
    if (!begin.done && Capacitor.isNativePlatform()) return { name: 'begin' }
    return to.name === 'welcome-language' || to.name === 'onboarding' || to.name === 'setup' ? { name: 'home' } : undefined
  }
  if (!state.languageChosen) return to.name === 'welcome-language' ? undefined : { name: 'welcome-language' }
  if (!state.onboardingSeen) return to.name === 'onboarding' ? undefined : { name: 'onboarding' }
  return to.name === 'setup' ? undefined : { name: 'setup' }
})

export const tabs = featureRoutes
  .flatMap((route) => (route.meta?.tab && typeof route.name === 'string' ? [{ name: route.name, ...route.meta.tab }] : []))
  .sort((a, b) => a.order - b.order)
