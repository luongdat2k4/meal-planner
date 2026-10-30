import { computed } from 'vue'
import { MOCK_MEMBER_NAMES, generateInviteCode } from '../../mock-data/household'
import { createPersistedState } from '../../shared/persisted'

export interface HouseholdMember {
  id: string
  name: string
  role: 'owner' | 'member'
}

export const MAX_MEMBERS = 5

interface HouseholdState {
  members: HouseholdMember[]
  inviteCode: string
  // Set when this user joined someone else's household.
  joinedCode: string | null
}

const defaults = (): HouseholdState => ({
  members: [{ id: 'me', name: 'Bạn', role: 'owner' }],
  inviteCode: generateInviteCode(),
  joinedCode: null,
})

const state = createPersistedState<HouseholdState>('meal-planner:household', defaults)

const isFull = computed(() => state.members.length >= MAX_MEMBERS)
const isOwner = computed(() => state.members.find((member) => member.id === 'me')?.role === 'owner')

export function useHousehold() {
  // Demo helper: there is no real invite flow yet, so this stands in for someone accepting.
  function addDemoMember(): boolean {
    if (isFull.value) return false
    const used = new Set(state.members.map((member) => member.name))
    const name = MOCK_MEMBER_NAMES.find((candidate) => !used.has(candidate)) ?? `Thành viên ${state.members.length + 1}`
    state.members.push({ id: crypto.randomUUID(), name, role: 'member' })
    return true
  }

  function removeMember(id: string) {
    if (id === 'me') return
    state.members = state.members.filter((member) => member.id !== id)
  }

  function renewInviteCode() {
    state.inviteCode = generateInviteCode()
  }

  function joinWithCode(code: string): boolean {
    const normalized = code.trim().toUpperCase()
    if (!/^MISE-[A-Z0-9]{6}$/.test(normalized)) return false
    state.members = [
      { id: 'owner', name: 'Mai', role: 'owner' },
      { id: 'me', name: 'Bạn', role: 'member' },
    ]
    state.joinedCode = normalized
    return true
  }

  function leave() {
    Object.assign(state, defaults())
  }

  return { state, isFull, isOwner, addDemoMember, removeMember, renewInviteCode, joinWithCode, leave }
}
