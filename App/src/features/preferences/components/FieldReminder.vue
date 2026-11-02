<script setup lang="ts">
import { ref } from 'vue'
import { ensureReminderPermission, remindersSupported, sendTestReminder } from '../../../app/reminders'
import { t } from '../../../shared/i18n'
import { showToast } from '../../../shared/toast'
import ToggleSwitch from '../../../shared/ui/ToggleSwitch.vue'
import { dayNames, shortDayNames } from '../../planner'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()
const native = remindersSupported()

// Turning the reminder on asks for notification permission first; without it the switch stays off.
const enabled = ref(state.reminder.enabled)

async function setEnabled(value: boolean) {
  if (value && !(await ensureReminderPermission())) {
    enabled.value = false
    showToast(t('reminder.denied'))
    return
  }
  enabled.value = value
  state.reminder.enabled = value
}

function toggleDay(index: number) {
  const days = state.reminder.days
  state.reminder.days = (days.includes(index) ? days.filter((day) => day !== index) : [...days, index]).sort((a, b) => a - b)
}

async function test() {
  showToast((await sendTestReminder()) ? t('reminder.testSent') : t('reminder.denied'))
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="font-semibold">{{ t('preferences.fieldReminder.title') }}</p>
        <p class="text-sm text-gray-500">{{ t('preferences.fieldReminder.subtitle') }}</p>
      </div>
      <ToggleSwitch :model-value="enabled" :label="t('preferences.fieldReminder.toggle')" @update:model-value="setEnabled" />
    </div>

    <template v-if="enabled">
      <div>
        <h3 class="mb-3 text-sm font-semibold text-gray-700">{{ t('preferences.fieldReminder.day') }}</h3>
        <div class="flex justify-between gap-1">
          <button
            v-for="(label, index) in shortDayNames()"
            :key="label"
            type="button"
            :aria-label="dayNames()[index]"
            :aria-pressed="state.reminder.days.includes(index)"
            class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition"
            :class="state.reminder.days.includes(index) ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-card text-gray-600 shadow-card'"
            @click="toggleDay(index)"
          >
            {{ label }}
          </button>
        </div>
        <p v-if="!state.reminder.days.length" class="mt-2 text-xs text-red-600">{{ t('preferences.fieldReminder.minDay') }}</p>
      </div>

      <label class="flex items-center justify-between gap-4 rounded-2xl bg-card px-4 py-3 shadow-card">
        <span class="text-sm font-semibold">{{ t('preferences.fieldReminder.time') }}</span>
        <input v-model="state.reminder.time" type="time" required class="rounded-xl bg-surface px-3 py-1.5 outline-none" />
      </label>

      <button
        v-if="native"
        type="button"
        class="w-full rounded-full bg-brand-soft py-2.5 text-sm font-semibold text-brand transition active:scale-[0.98]"
        @click="test"
      >
        {{ t('reminder.test') }}
      </button>
      <p v-else class="text-xs text-gray-500">{{ t('preferences.fieldReminder.webNote') }}</p>
    </template>
  </div>
</template>
