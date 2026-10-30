import { resetRuntime } from '../backend/runtime'
import { useHousehold } from '../features/household'
import { usePreferences } from '../features/preferences'
import { usePremium } from '../features/premium'
import { useShopping } from '../features/shopping'

// Clears every piece of locally stored user data. Lives in app/ because it spans all features.
export function resetAllData() {
  // One transaction empties preference, meal_activity, plan, plan_item and shopping_item.
  resetRuntime()
  useShopping().reset()
  usePreferences().reset()
  useHousehold().leave()
  usePremium().reset()
}
