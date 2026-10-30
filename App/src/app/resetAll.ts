import { useAccount } from '../features/account'
import { useHousehold } from '../features/household'
import { useFavorites, useMealActivity } from '../features/meals'
import { usePlanner } from '../features/planner'
import { usePreferences } from '../features/preferences'
import { usePremium } from '../features/premium'
import { useShopping } from '../features/shopping'

// Clears every piece of locally stored user data. Lives in app/ because it spans all features.
export function resetAllData() {
  usePlanner().reset()
  useShopping().reset()
  useFavorites().reset()
  useMealActivity().reset()
  usePreferences().reset()
  useHousehold().leave()
  useAccount().reset()
  usePremium().reset()
}
