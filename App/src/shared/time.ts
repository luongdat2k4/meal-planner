import { lang, languages, t } from './i18n'

// Times are stored as "HH:mm" (24 hours). How they are shown follows the language (country) the user picked in the
// app, not the phone: Vietnam reads 19:30, English-speaking countries 7:30 PM (see `languages` in i18n.ts).
export const uses12Hour = (): boolean => languages.find((option) => option.id === lang.value)?.hour12 ?? false

export const parseTime = (value: string): { hour: number; minute: number } => {
  const [hour, minute] = value.split(':').map(Number)
  return { hour: Math.min(Math.max(hour ?? 0, 0), 23), minute: Math.min(Math.max(minute ?? 0, 0), 59) }
}

const pad = (value: number) => String(value).padStart(2, '0')

export const toTime = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`

/** "HH:mm" as the user reads it: "19:30" or "7:30 PM". */
export function formatTime(value: string): string {
  const { hour, minute } = parseTime(value)
  if (!uses12Hour()) return toTime(hour, minute)
  return `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? t('ui.am') : t('ui.pm')}`
}
