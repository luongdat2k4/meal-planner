<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import { MEALS, getMeal } from '../meals'
import { DAY_NAMES } from './types'
import { usePlanner } from './usePlanner'

const { state, addMealToDay, removeMealFromDay, clearDay } = usePlanner()

// Open on today (Monday = 0).
const activeDay = ref(String((new Date().getDay() + 6) % 7))
const pendingMeal = ref('')

const dayIndex = computed(() => Number(activeDay.value))
const dayOptions = computed(() =>
  DAY_NAMES.map((name, index) => {
    const count = (state.plan[index] ?? []).length
    return { id: String(index), label: count ? `${name} · ${count}` : name }
  }),
)
const dayMeals = computed(() =>
  (state.plan[dayIndex.value] ?? []).map((mealId, index) => ({ index, mealId, meal: getMeal(mealId) })),
)

function add() {
  if (!pendingMeal.value) return
  addMealToDay(dayIndex.value, pendingMeal.value)
  pendingMeal.value = ''
}
</script>

<template>
  <section class="space-y-4">
    <ChipTabs v-model="activeDay" :options="dayOptions" />

    <div class="flex items-center justify-between">
      <h2 class="font-semibold">{{ DAY_NAMES[dayIndex] }}</h2>
      <button v-if="dayMeals.length" type="button" class="text-sm text-gray-500 hover:text-red-600" @click="clearDay(dayIndex)">
        Xóa ngày
      </button>
    </div>

    <ul v-if="dayMeals.length" class="space-y-3">
      <li
        v-for="item in dayMeals"
        :key="`${item.mealId}-${item.index}`"
        class="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-card"
      >
        <RouterLink
          :to="{ name: 'meal-detail', params: { id: item.mealId } }"
          class="flex min-w-0 flex-1 items-center gap-3"
        >
          <img
            v-if="item.meal"
            :src="assetUrl(item.meal.image)"
            :alt="item.meal.title"
            loading="lazy"
            class="h-16 w-16 shrink-0 rounded-2xl object-cover"
          />
          <span class="line-clamp-2 text-sm font-semibold leading-snug">{{ item.meal?.title ?? item.mealId }}</span>
        </RouterLink>
        <button
          type="button"
          class="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
          aria-label="Xóa khỏi kế hoạch"
          @click="removeMealFromDay(dayIndex, item.index)"
        >
          <Icon :icon="ICONS.trash" class="text-xl" />
        </button>
      </li>
    </ul>

    <div v-else class="rounded-3xl bg-white px-6 py-10 text-center shadow-card">
      <Icon :icon="ICONS.calendarWeek" class="mx-auto mb-3 text-5xl text-gray-300" />
      <p class="mb-4 text-gray-500">Chưa có món nào cho {{ DAY_NAMES[dayIndex] }}.</p>
      <RouterLink :to="{ name: 'meals' }" class="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
        Chọn món
      </RouterLink>
    </div>

    <div class="flex gap-2">
      <select
        v-model="pendingMeal"
        class="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3.5 text-sm shadow-card outline-none ring-1 ring-transparent focus:ring-brand/40"
      >
        <option value="" disabled>Thêm nhanh một món...</option>
        <option v-for="meal in MEALS" :key="meal.id" :value="meal.id">{{ meal.title }}</option>
      </select>
      <button
        type="button"
        class="flex shrink-0 items-center gap-1 rounded-2xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40"
        :disabled="!pendingMeal"
        @click="add"
      >
        <Icon :icon="ICONS.plus" /> Thêm
      </button>
    </div>
  </section>
</template>
