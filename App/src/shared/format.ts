import { text } from '../backend/catalogText'

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} đ`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`
}

// Grams round to 10, other units (slugs such as tbsp, tsp, piece) to the nearest half.
export function formatAmount(amount: number, unit: string): string {
  if (unit === 'g') {
    const grams = Math.max(10, Math.round(amount / 10) * 10)
    return grams >= 1000 ? `${Math.round(grams / 100) / 10} kg` : `${grams} g`
  }
  return `${Math.max(0.5, Math.round(amount * 2) / 2)} ${text(unit)}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}
