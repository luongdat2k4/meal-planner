import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { accountRoutes } from '../features/account/routes'
import { householdRoutes } from '../features/household/routes'
import { ingredientsRoutes } from '../features/ingredients/routes'
import { mealsRoutes } from '../features/meals/routes'
import { plannerRoutes } from '../features/planner/routes'
import { usePreferences } from '../features/preferences'
import { preferencesRoutes } from '../features/preferences/routes'
import { premiumRoutes } from '../features/premium/routes'
import { settingsRoutes } from '../features/settings/routes'
import { shoppingRoutes } from '../features/shopping/routes'

const featureRoutes: RouteRecordRaw[] = [
  ...mealsRoutes,
  ...plannerRoutes,
  ...ingredientsRoutes,
  ...shoppingRoutes,
  ...settingsRoutes,
  ...preferencesRoutes,
  ...householdRoutes,
  ...accountRoutes,
  ...premiumRoutes,
]

// Clean URLs need the server (Vite, Capacitor's local server) to fall back to index.html for unknown paths.
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'meals' } },
    ...featureRoutes,
    { path: '/:pathMatch(.*)*', redirect: { name: 'meals' } },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

// First run: send people through onboarding until they finish or skip it.
router.beforeEach((to) => {
  const { state } = usePreferences()
  if (!state.onboardingDone && to.name !== 'onboarding') return { name: 'onboarding' }
  if (state.onboardingDone && to.name === 'onboarding') return { name: 'meals' }
})

export const tabs = featureRoutes
  .flatMap((route) => (route.meta?.tab && typeof route.name === 'string' ? [{ name: route.name, ...route.meta.tab }] : []))
  .sort((a, b) => a.order - b.order)
