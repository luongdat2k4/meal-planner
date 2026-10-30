import { reactive, watch } from 'vue'
import { getPreference, savePreference } from '../../backend/runtime'
import { toDayIndex, toWeekday } from '../../shared/date'
import { createPersistedState } from '../../shared/persisted'
import type { Preferences } from './types'

// The `preference` table holds the answers the planner needs. The rest is UI state with no column,
// so it stays in localStorage: which first-run screens were seen, and the reminder's day and time
// (the table only has the weekly_reminder switch).
interface Flow {
  languageChosen: boolean
  onboardingSeen: boolean
  setupDone: boolean
  setupStep: number
  reminderDay: number
  reminderTime: string
}

const flow = createPersistedState<Flow>('meal-planner:flow', () => ({
  languageChosen: false,
  onboardingSeen: false,
  setupDone: false,
  setupStep: 0,
  reminderDay: 6,
  reminderTime: '18:00',
}))

const defaults = (): Preferences => ({
  languageChosen: flow.languageChosen,
  onboardingSeen: flow.onboardingSeen,
  setupDone: flow.setupDone,
  setupStep: flow.setupStep,
  householdSize: 2,
  dietaryIds: [],
  allergenIds: [],
  proteinLikes: [],
  cookingDays: [0, 1, 2, 3, 4],
  maxCookMinutes: 45,
  weeklyBudget: 1_200_000,
  reminder: { enabled: false, day: flow.reminderDay, time: flow.reminderTime },
})

function load(): Preferences {
  const base = defaults()
  const row = getPreference()
  if (!row) return base
  return {
    ...base,
    householdSize: row.householdSize,
    dietaryIds: row.dietaryIds,
    allergenIds: row.allergenIds,
    proteinLikes: row.proteinLikes,
    // The database numbers weekdays 1..7; the UI uses 0..6 from Monday.
    cookingDays: row.cookingDays.map(toDayIndex),
    maxCookMinutes: row.maxCookMinutes ?? base.maxCookMinutes,
    weeklyBudget: row.weeklyBudget ?? base.weeklyBudget,
    reminder: { ...base.reminder, enabled: row.weeklyReminder },
  }
}

function persist(state: Preferences) {
  flow.languageChosen = state.languageChosen
  flow.onboardingSeen = state.onboardingSeen
  flow.setupDone = state.setupDone
  flow.setupStep = state.setupStep
  flow.reminderDay = state.reminder.day
  flow.reminderTime = state.reminder.time
  savePreference({
    householdSize: state.householdSize,
    dietaryIds: [...state.dietaryIds],
    allergenIds: [...state.allergenIds],
    proteinLikes: [...state.proteinLikes],
    cookingDays: state.cookingDays.map(toWeekday),
    maxCookMinutes: state.maxCookMinutes,
    weeklyBudget: state.weeklyBudget,
    weeklyReminder: state.reminder.enabled,
  })
}

// Created on first use, because the runtime database is opened before the app mounts, not when this module loads.
let state: Preferences | null = null

function getState(): Preferences {
  if (state) return state
  const created = reactive<Preferences>(load())
  watch(created, (value) => persist(value), { deep: true, flush: 'sync' })
  state = created
  return created
}

export function usePreferences() {
  const prefs = getState()

  function completeLanguage() {
    prefs.languageChosen = true
  }

  function completeOnboarding() {
    prefs.onboardingSeen = true
  }

  function completeSetup() {
    prefs.setupDone = true
    prefs.setupStep = 0
  }

  // The runtime tables were already emptied by resetRuntime; this puts the form back to its defaults and starts the
  // first-run flow again from the language step.
  function reset() {
    flow.languageChosen = false
    flow.onboardingSeen = false
    flow.setupDone = false
    flow.setupStep = 0
    flow.reminderDay = 6
    flow.reminderTime = '18:00'
    Object.assign(prefs, defaults())
  }

  return { state: prefs, completeLanguage, completeOnboarding, completeSetup, reset }
}
