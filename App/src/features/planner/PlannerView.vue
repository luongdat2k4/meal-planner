<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ICONS } from '../../shared/icons'
import { MEALS } from '../meals'
import { DAY_NAMES } from './types'
import { usePlanner } from './usePlanner'

const { state, addMealToDay, removeMealFromDay, clearDay } = usePlanner()

// Meal chosen to add per day, keyed by day index.
const pending = ref<Record<number, string>>({})

const titleOf = (id: string) => MEALS.find((m) => m.id === id)?.title ?? id

function add(day: number) {
  const mealId = pending.value[day]
  if (!mealId) return
  addMealToDay(day, mealId)
  pending.value[day] = ''
}
</script>

<template>
  <section class="space-y-3">
    <p class="text-sm text-gray-500">Lên kế hoạch bữa ăn cho cả tuần.</p>

    <article v-for="(day, index) in DAY_NAMES" :key="day" class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <header class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 font-semibold">
          <Icon :icon="ICONS.calendarWeek" class="text-brand" /> {{ day }}
        </h2>
        <button
          v-if="(state.plan[index] ?? []).length"
          type="button"
          class="text-xs text-gray-500 hover:text-red-600"
          @click="clearDay(index)"
        >
          Xóa ngày
        </button>
      </header>

      <ul v-if="(state.plan[index] ?? []).length" class="mb-3 space-y-2">
        <li
          v-for="(mealId, i) in state.plan[index]"
          :key="`${mealId}-${i}`"
          class="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm"
        >
          <span class="truncate">{{ titleOf(mealId) }}</span>
          <button type="button" class="shrink-0 text-gray-400 hover:text-red-600" @click="removeMealFromDay(index, i)">
            <Icon :icon="ICONS.trash" class="text-lg" />
          </button>
        </li>
      </ul>
      <p v-else class="mb-3 text-sm text-gray-400">Chưa có món nào.</p>

      <div class="flex gap-2">
        <select
          v-model="pending[index]"
          class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="" disabled>Chọn món...</option>
          <option v-for="meal in MEALS" :key="meal.id" :value="meal.id">{{ meal.title }}</option>
        </select>
        <button
          type="button"
          class="flex shrink-0 items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          :disabled="!pending[index]"
          @click="add(index)"
        >
          <Icon :icon="ICONS.plus" /> Thêm
        </button>
      </div>
    </article>
  </section>
</template>
