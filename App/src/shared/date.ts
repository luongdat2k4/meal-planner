const pad = (value: number) => String(value).padStart(2, '0')

// Local calendar date as YYYY-MM-DD. `toISOString()` would give the UTC date, which is wrong near midnight.
export function localDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Monday of the week containing `date`; the key of the `plan` table.
export function weekStart(date: Date = new Date()): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return localDate(monday)
}

// The app numbers days 0..6 from Monday; the database uses weekday 1..7.
export const toWeekday = (dayIndex: number) => dayIndex + 1
export const toDayIndex = (weekday: number) => weekday - 1
