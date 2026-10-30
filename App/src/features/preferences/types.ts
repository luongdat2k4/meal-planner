export interface Dietary {
  // Dietary slug; also the key of its translated name.
  id: string
  readonly name: string
  icon: string
}

export interface Reminder {
  enabled: boolean
  // Day index (0 = Monday) and "HH:mm".
  day: number
  time: string
}

export interface Preferences {
  // The welcome slides (/onboarding) shown before the preference questions.
  onboardingSeen: boolean
  // The preference questions (/setup) are finished or skipped.
  setupDone: boolean
  // Last setup step reached, so an interrupted flow can resume.
  setupStep: number
  householdSize: number
  dietaryIds: string[]
  allergenIds: string[]
  // Meal category ids (chicken, beef, ...) the user likes.
  proteinLikes: string[]
  cookingDays: number[]
  maxCookMinutes: number
  // VND per week.
  weeklyBudget: number
  reminder: Reminder
}
