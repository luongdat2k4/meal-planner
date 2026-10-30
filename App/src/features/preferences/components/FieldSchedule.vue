<script setup lang="ts">
import { computed } from 'vue'
import { formatVnd } from '../../../shared/format'
import { DAY_NAMES } from '../../planner'
import { BUDGET } from '../options'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()

const shortDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function toggleDay(index: number) {
  const next = state.cookingDays.includes(index) ? state.cookingDays.filter((day) => day !== index) : [...state.cookingDays, index]
  state.cookingDays = next.sort((a, b) => a - b)
}

const perPersonMeal = computed(() =>
  state.cookingDays.length ? state.weeklyBudget / state.cookingDays.length / state.householdSize : 0,
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="mb-3 font-semibold">Những ngày bạn nấu</h3>
      <div class="flex justify-between gap-1">
        <button
          v-for="(label, index) in shortDays"
          :key="label"
          type="button"
          :aria-label="DAY_NAMES[index]"
          :aria-pressed="state.cookingDays.includes(index)"
          class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition"
          :class="state.cookingDays.includes(index) ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-card text-gray-600 shadow-card'"
          @click="toggleDay(index)"
        >
          {{ label }}
        </button>
      </div>
      <p v-if="!state.cookingDays.length" class="mt-2 text-xs text-red-600">Hãy chọn ít nhất một ngày.</p>
    </div>

    <div>
      <div class="mb-3 flex items-baseline justify-between">
        <h3 class="font-semibold">Ngân sách mỗi tuần</h3>
        <span class="text-lg font-bold text-brand">{{ formatVnd(state.weeklyBudget) }}</span>
      </div>
      <input
        v-model.number="state.weeklyBudget"
        type="range"
        :min="BUDGET.min"
        :max="BUDGET.max"
        :step="BUDGET.step"
        class="w-full accent-brand"
        aria-label="Ngân sách mỗi tuần"
      />
      <p class="mt-2 text-xs text-gray-500">
        Khoảng {{ formatVnd(perPersonMeal) }} cho mỗi người mỗi bữa.
      </p>
    </div>
  </div>
</template>
