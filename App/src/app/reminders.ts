import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { t } from '../shared/i18n'

// The weekly planning reminder, delivered as local notifications on the phone: one repeating notification per chosen
// weekday at the chosen time. It only exists in the native app; on the web the setting is saved but nothing is sent.

export const remindersSupported = () => Capacitor.isNativePlatform()

const CHANNEL = 'planning'
// Ids 1..7 are the weekly notifications (day index + 1); the test notification has its own id.
const TEST_ID = 100

export interface ReminderSchedule {
  enabled: boolean
  // Day indexes, 0 = Monday.
  days: number[]
  // "HH:mm".
  time: string
}

// Capacitor numbers weekdays from Sunday = 1; the app numbers them from Monday = 0.
const toNativeWeekday = (dayIndex: number) => ((dayIndex + 1) % 7) + 1

/** Asks the user for notification permission when needed; true when notifications can be shown. */
export async function ensureReminderPermission(): Promise<boolean> {
  if (!remindersSupported()) return true
  try {
    let { display } = await LocalNotifications.checkPermissions()
    if (display === 'prompt' || display === 'prompt-with-rationale') display = (await LocalNotifications.requestPermissions()).display
    return display === 'granted'
  } catch {
    return false
  }
}

async function ensureChannel() {
  await LocalNotifications.createChannel({ id: CHANNEL, name: t('reminder.channel'), importance: 3 })
}

/** Replaces every scheduled reminder with the given schedule (none when it is off). */
export async function syncReminders(schedule: ReminderSchedule) {
  if (!remindersSupported()) return
  try {
    await LocalNotifications.cancel({ notifications: Array.from({ length: 7 }, (_, index) => ({ id: index + 1 })) })
    if (!schedule.enabled || !schedule.days.length) return
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return
    const [hour, minute] = schedule.time.split(':').map(Number)
    await ensureChannel()
    await LocalNotifications.schedule({
      notifications: schedule.days.map((day) => ({
        id: day + 1,
        title: t('reminder.title'),
        body: t('reminder.body'),
        channelId: CHANNEL,
        schedule: { on: { weekday: toNativeWeekday(day), hour: hour ?? 18, minute: minute ?? 0 }, allowWhileIdle: true },
      })),
    })
  } catch (error) {
    console.error('[reminders] could not schedule', error)
  }
}

/** Shows the reminder in a few seconds, so the user can see how it looks on their phone. */
export async function sendTestReminder(): Promise<boolean> {
  if (!remindersSupported() || !(await ensureReminderPermission())) return false
  try {
    await ensureChannel()
    await LocalNotifications.schedule({
      notifications: [
        { id: TEST_ID, title: t('reminder.title'), body: t('reminder.body'), channelId: CHANNEL, schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true } },
      ],
    })
    return true
  } catch {
    return false
  }
}
