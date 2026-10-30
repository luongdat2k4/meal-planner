import { createPersistedState } from '../../shared/persisted'

export type AccountProvider = 'google' | 'apple'

interface AccountState {
  signedIn: boolean
  provider: AccountProvider | null
  name: string
  email: string
  lastSyncAt: string | null
}

const defaults = (): AccountState => ({ signedIn: false, provider: null, name: '', email: '', lastSyncAt: null })

const state = createPersistedState<AccountState>('meal-planner:account', defaults)

export function useAccount() {
  // MOCK: no real authentication; this only fills in a placeholder profile.
  function signIn(provider: AccountProvider) {
    state.signedIn = true
    state.provider = provider
    state.name = 'Người dùng demo'
    state.email = 'demo@example.com'
    state.lastSyncAt = new Date().toISOString()
  }

  function markSynced() {
    state.lastSyncAt = new Date().toISOString()
  }

  function signOut() {
    Object.assign(state, defaults())
  }

  return { state, signIn, markSynced, signOut, reset: signOut }
}
