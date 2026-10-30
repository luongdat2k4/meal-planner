import { resetRuntime } from '../backend/runtime'
import { usePreferences } from '../features/preferences'
import { useShopping } from '../features/shopping'

// Clears every piece of locally stored user data. Lives in app/ because it spans all features.
export function resetAllData() {
  // One transaction empties preference, meal_activity, plan, plan_item and shopping_item.
  resetRuntime()
  useShopping().reset()
  usePreferences().reset()
}
