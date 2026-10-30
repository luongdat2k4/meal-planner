<script setup lang="ts">
import { computed } from 'vue'
import ChipTabs from '../../../shared/ui/ChipTabs.vue'
import ToggleSwitch from '../../../shared/ui/ToggleSwitch.vue'
import { DAY_NAMES } from '../../planner'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()

const dayOptions = DAY_NAMES.map((name, index) => ({ id: String(index), label: name }))

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
        <p class="font-semibold">Nhắc tôi lập kế hoạch mỗi tuần</p>
        <p class="text-sm text-gray-500">Một lời nhắc đúng ngày và giờ bạn chọn.</p>
      </div>
      <ToggleSwitch v-model="state.reminder.enabled" label="Nhắc lập kế hoạch hằng tuần" />
    </div>

    <template v-if="state.reminder.enabled">
      <div>
        <h3 class="mb-1 text-sm font-semibold text-gray-700">Ngày nhắc</h3>
        <ChipTabs v-model="day" :options="dayOptions" />
      </div>
      <label class="flex items-center justify-between gap-4 rounded-2xl bg-card px-4 py-3 shadow-card">
        <span class="text-sm font-semibold">Giờ nhắc</span>
        <input v-model="state.reminder.time" type="time" class="rounded-xl bg-surface px-3 py-1.5 outline-none" />
      </label>
      <p class="text-xs text-gray-500">Bản demo: lời nhắc chưa được gửi thật trên thiết bị.</p>
    </template>
  </div>
</template>
