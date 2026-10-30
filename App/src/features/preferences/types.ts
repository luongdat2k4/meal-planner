export interface Dietary {
  id: string
  name: string
  icon: string
}

export interface Reminder {
  enabled: boolean
  // Day index (0 = Monday) and "HH:mm".
  day: number
  time: string
}

export interface Preferences {
  onboardingDone: boolean
  // Last onboarding step reached, so an interrupted flow can resume.
  onboardingStep: number
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
