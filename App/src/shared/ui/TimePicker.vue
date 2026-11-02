<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { t } from '../i18n'
import { ICONS } from '../icons'
import { formatTime, parseTime, toTime, uses12Hour } from '../time'
import BottomSheet from './BottomSheet.vue'
import WheelColumn from './WheelColumn.vue'

// A time of day as "HH:mm" (24 hours), chosen on scroll wheels in a bottom sheet instead of the browser's own time
// input. The wheels follow the phone's clock format: hour and minute for 24 hours, plus AM/PM for 12 hours.
defineProps<{ title: string }>()
const model = defineModel<string>({ required: true })

const pad = (value: number) => String(value).padStart(2, '0')
const twelve = ref(uses12Hour())
const hours = computed(() => (twelve.value ? Array.from({ length: 12 }, (_, index) => String(index + 1)) : Array.from({ length: 24 }, (_, hour) => pad(hour))))
const MINUTES = Array.from({ length: 60 }, (_, minute) => pad(minute))
const periods = computed(() => [t('ui.am'), t('ui.pm')])

const open = ref(false)
// Wheel positions: an index into `hours`, the minute, and 0 = AM / 1 = PM (12-hour clocks only).
const hourIndex = ref(0)
const minute = ref(0)
const period = ref(0)

// The wheels start from the current value each time the sheet opens, and nothing is kept until "Done".
watch(open, (isOpen) => {
  if (!isOpen) return
  twelve.value = uses12Hour()
  const time = parseTime(model.value)
  minute.value = time.minute
  period.value = time.hour < 12 ? 0 : 1
  hourIndex.value = twelve.value ? (time.hour % 12 || 12) - 1 : time.hour
})

function confirm() {
  // 12-hour: 12 AM is 00:xx and 12 PM is 12:xx.
  const hour = twelve.value ? ((hourIndex.value + 1) % 12) + period.value * 12 : hourIndex.value
  model.value = toTime(hour, minute.value)
  open.value = false
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 rounded-xl bg-surface px-3 py-1.5 font-medium tabular-nums transition active:scale-[0.98]"
    :aria-label="`${title}: ${formatTime(model)}`"
    @click="open = true"
  >
    {{ formatTime(model) }}
    <Icon :icon="ICONS.clockOutline" class="text-lg text-gray-500" />
  </button>

  <BottomSheet v-model="open" :title="title">
    <div class="relative">
      <!-- The band behind the chosen row, and fades at the top and bottom of the wheels. -->
      <div class="pointer-events-none absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 rounded-2xl bg-brand-soft" aria-hidden="true" />
      <div class="relative flex items-center justify-center gap-2">
        <WheelColumn v-model="hourIndex" :options="hours" :label="t('ui.hour')" class="w-20" />
        <span class="pb-0.5 text-2xl font-bold text-gray-900" aria-hidden="true">:</span>
        <WheelColumn v-model="minute" :options="MINUTES" :label="t('ui.minute')" class="w-20" />
        <WheelColumn v-if="twelve" v-model="period" :options="periods" :label="t('ui.period')" class="ml-2 w-20" />
      </div>
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface opacity-90"
        aria-hidden="true"
      />
    </div>

    <button
      type="button"
      class="mt-5 w-full rounded-full bg-brand py-3.5 font-semibold text-white shadow-md shadow-brand/30 transition active:scale-[0.98]"
      @click="confirm"
    >
      {{ t('ui.done') }}
    </button>
  </BottomSheet>
</template>
