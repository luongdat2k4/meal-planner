import { t } from '../../shared/i18n'

// Day names, Monday first. Functions rather than constants so they follow the language switch.
export const dayNames = (): string[] => Array.from({ length: 7 }, (_, index) => t(`day.long.${index}`))
export const shortDayNames = (): string[] => Array.from({ length: 7 }, (_, index) => t(`day.short.${index}`))
