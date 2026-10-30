<script setup lang="ts">
import { computed } from 'vue'
import { formatVnd } from '../../../shared/format'
import { t } from '../../../shared/i18n'
import { dayNames, shortDayNames } from '../../planner'
import { BUDGET } from '../options'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()

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
      <h3 class="mb-3 font-semibold">{{ t('preferences.fieldSchedule.days') }}</h3>
      <div class="flex justify-between gap-1">
        <button
          v-for="(label, index) in shortDayNames()"
          :key="label"
          type="button"
          :aria-label="dayNames()[index]"
          :aria-pressed="state.cookingDays.includes(index)"
          class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition"
          :class="state.cookingDays.includes(index) ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-card text-gray-600 shadow-card'"
          @click="toggleDay(index)"
        >
          {{ label }}
        </button>
      </div>
      <p v-if="!state.cookingDays.length" class="mt-2 text-xs text-red-600">{{ t('preferences.fieldSchedule.minDay') }}</p>
    </div>

    <div>
      <div class="mb-3 flex items-baseline justify-between">
        <h3 class="font-semibold">{{ t('preferences.fieldSchedule.budget') }}</h3>
        <span class="text-lg font-bold text-brand">{{ formatVnd(state.weeklyBudget) }}</span>
      </div>
      <input
        v-model.number="state.weeklyBudget"
        type="range"
        :min="BUDGET.min"
        :max="BUDGET.max"
        :step="BUDGET.step"
        class="w-full accent-brand"
        :aria-label="t('preferences.fieldSchedule.budget')"
      />
      <p class="mt-2 text-xs text-gray-500">
        {{ t('preferences.fieldSchedule.perPerson', { amount: formatVnd(perPersonMeal) }) }}
      </p>
    </div>
  </div>
</template>
