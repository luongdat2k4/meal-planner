<script setup lang="ts">
import { computed } from 'vue'
import { toDayIndex, todayIndex } from '../../../shared/date'
import { t } from '../../../shared/i18n'
import BottomSheet from '../../../shared/ui/BottomSheet.vue'
import { usePlanner, type DayRange } from '../../planner'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ pick: [range: DayRange] }>()

const { state } = usePlanner()

// Days already cooked are never offered: the choices all start today. When they collapse into the same days
// (late in the week) only the first is kept.
const options = computed(() => {
  const today = todayIndex()
  const all = [
    { id: 'today', label: t('shopping.range.today'), range: { from: today, to: today } },
    { id: 'next3', label: t('shopping.range.next3'), range: { from: today, to: Math.min(today + 2, 6) } },
    { id: 'rest', label: t('shopping.range.rest'), range: { from: today, to: 6 } },
  ]
  const seen = new Set<string>()
  return all
    .filter((option) => {
      const key = `${option.range.from}-${option.range.to}`
      return !seen.has(key) && seen.add(key)
    })
    .map((option) => ({
      ...option,
      meals: state.items.filter((item) => toDayIndex(item.weekday) >= option.range.from && toDayIndex(item.weekday) <= option.range.to).length,
    }))
})

function pick(range: DayRange) {
  open.value = false
  emit('pick', range)
}
</script>

<template>
  <BottomSheet v-model="open" :title="t('shopping.range.title')">
    <ul class="space-y-3">
      <li v-for="option in options" :key="option.id">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-left shadow-card transition active:scale-[0.99] disabled:opacity-40"
          :disabled="!option.meals"
          @click="pick(option.range)"
        >
          <span class="font-semibold">{{ option.label }}</span>
          <span class="text-sm text-gray-500">{{ option.meals ? t('shopping.range.mealCount', { count: option.meals }) : t('shopping.range.noMeals') }}</span>
        </button>
      </li>
    </ul>
  </BottomSheet>
</template>
