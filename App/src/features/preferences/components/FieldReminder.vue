<script setup lang="ts">
import { computed } from 'vue'
import ChipTabs from '../../../shared/ui/ChipTabs.vue'
import ToggleSwitch from '../../../shared/ui/ToggleSwitch.vue'
import { t } from '../../../shared/i18n'
import { dayNames } from '../../planner'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()

const dayOptions = computed(() => dayNames().map((name, index) => ({ id: String(index), label: name })))

const day = computed({
  get: () => String(state.reminder.day),
  set: (value: string) => {
    state.reminder.day = Number(value)
  },
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="font-semibold">{{ t('preferences.fieldReminder.title') }}</p>
        <p class="text-sm text-gray-500">{{ t('preferences.fieldReminder.subtitle') }}</p>
      </div>
      <ToggleSwitch v-model="state.reminder.enabled" :label="t('preferences.fieldReminder.toggle')" />
    </div>

    <template v-if="state.reminder.enabled">
      <div>
        <h3 class="mb-1 text-sm font-semibold text-gray-700">{{ t('preferences.fieldReminder.day') }}</h3>
        <ChipTabs v-model="day" :options="dayOptions" />
      </div>
      <label class="flex items-center justify-between gap-4 rounded-2xl bg-card px-4 py-3 shadow-card">
        <span class="text-sm font-semibold">{{ t('preferences.fieldReminder.time') }}</span>
        <input v-model="state.reminder.time" type="time" class="rounded-xl bg-surface px-3 py-1.5 outline-none" />
      </label>
      <p class="text-xs text-gray-500">{{ t('preferences.fieldReminder.demo') }}</p>
    </template>
  </div>
</template>
