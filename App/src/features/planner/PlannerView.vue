<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { formatMinutes, formatVnd } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import { t } from '../../shared/i18n'
import { showToast } from '../../shared/toast'
import BottomSheet from '../../shared/ui/BottomSheet.vue'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import { getMeal, getRecipe, type Meal } from '../meals'
import { usePreferences } from '../preferences'
import { useShopping } from '../shopping'
import { planCost, regeneratePlan, swapCandidates } from './generatePlan'
import { dayNames } from './types'
import { usePlanner } from './usePlanner'

const { state, plannedMealCount, removeMealFromDay, replaceMeal, clearDay } = usePlanner()
const { state: prefs } = usePreferences()
const { importFromPlan } = useShopping()

// Open on today (Monday = 0).
const activeDay = ref(String((new Date().getDay() + 6) % 7))
const generating = ref(false)

const dayIndex = computed(() => Number(activeDay.value))
const dayOptions = computed(() => dayNames().map((name, index) => ({ id: String(index), label: name })))
const dayLabel = computed(() => dayNames()[dayIndex.value])
const dayMeals = computed(() =>
  state.items
    .filter((item) => item.weekday === dayIndex.value + 1)
    .map((item, index) => ({ index, mealId: item.mealSlug, servings: item.servings, meal: getMeal(item.mealSlug) })),
)

const cost = computed(() => planCost())
const budgetRatio = computed(() => (prefs.weeklyBudget ? Math.min(cost.value / prefs.weeklyBudget, 1) : 0))
const overBudget = computed(() => cost.value > prefs.weeklyBudget)

const priceOf = (mealId: string, servings = prefs.householdSize) => (getRecipe(mealId)?.pricePerServing ?? 0) * servings
const minutesOf = (mealId: string) => {
  const recipe = getRecipe(mealId)
  return recipe ? recipe.prepMinutes + recipe.cookMinutes : 0
}

async function generate() {
  generating.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  regeneratePlan()
  generating.value = false
  const firstDay = Object.keys(state.plan)[0]
  if (firstDay !== undefined) activeDay.value = firstDay
  showToast(t('planner.toast.generated'))
}

function addToShopping() {
  const added = importFromPlan()
  showToast(added ? t('planner.toast.addedToShopping', { count: added }) : t('planner.toast.shoppingUpToDate'))
}

const swapTarget = ref<{ day: number; index: number; mealId: string } | null>(null)
const swapOptions = ref<Meal[]>([])
const swapOpen = computed({
  get: () => swapTarget.value !== null,
  set: (open: boolean) => {
    if (!open) swapTarget.value = null
  },
})

function openSwap(index: number, mealId: string) {
  swapOptions.value = swapCandidates(mealId)
  swapTarget.value = { day: dayIndex.value, index, mealId }
}

function applySwap(newMealId: string) {
  if (!swapTarget.value) return
  replaceMeal(swapTarget.value.day, swapTarget.value.index, newMealId)
  swapTarget.value = null
  showToast(t('planner.toast.swapped'))
}
</script>

<template>
  <section class="space-y-4">
    <!-- Week summary -->
    <div class="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      <template v-if="plannedMealCount">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ t('planner.summary.cost') }}</p>
            <p class="text-2xl font-bold" :class="overBudget ? 'text-red-600' : ''">{{ formatVnd(cost) }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">{{ t('planner.summary.budget') }}</p>
            <p class="font-semibold">{{ formatVnd(prefs.weeklyBudget) }}</p>
          </div>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-gray-200">
          <div class="h-full rounded-full transition-all" :class="overBudget ? 'bg-red-500' : 'bg-brand'" :style="{ width: `${budgetRatio * 100}%` }" />
        </div>
        <p v-if="overBudget" class="text-sm text-red-600">{{ t('planner.summary.over', { amount: formatVnd(cost - prefs.weeklyBudget) }) }}</p>
      </template>
      <div v-else>
        <p class="font-semibold">{{ t('planner.summary.emptyTitle') }}</p>
        <p class="text-sm text-gray-500">
          {{ t('planner.summary.emptyHintBefore') }}
          <RouterLink :to="{ name: 'preferences' }" class="font-medium text-brand">{{ t('planner.summary.emptyHintLink') }}</RouterLink>.
        </p>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-md shadow-brand/30 transition active:scale-[0.98] disabled:opacity-50"
          :disabled="generating || !prefs.cookingDays.length"
          @click="generate"
        >
          <Icon :icon="ICONS.autoFix" class="text-lg" />
          {{ generating ? t('planner.generating') : plannedMealCount ? t('planner.regenerate') : t('planner.generate') }}
        </button>
        <button
          v-if="plannedMealCount"
          type="button"
          class="flex items-center justify-center gap-2 rounded-full bg-brand-soft px-4 py-3 text-sm font-semibold text-brand transition active:scale-[0.98]"
          @click="addToShopping"
        >
          <Icon :icon="ICONS.cart" class="text-lg" /> {{ t('planner.shop') }}
        </button>
      </div>
    </div>

    <ChipTabs v-model="activeDay" :options="dayOptions" />

    <div class="flex items-center justify-between">
      <h2 class="font-semibold">{{ dayLabel }}</h2>
      <button v-if="dayMeals.length" type="button" class="text-sm text-gray-500 hover:text-red-600" @click="clearDay(dayIndex)">
        {{ t('planner.clearDay') }}
      </button>
    </div>

    <ul v-if="dayMeals.length" class="space-y-3">
      <li v-for="item in dayMeals" :key="`${item.mealId}-${item.index}`" class="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-card">
        <RouterLink :to="{ name: 'meal-detail', params: { id: item.mealId } }" class="flex min-w-0 flex-1 items-center gap-3">
          <img
            v-if="item.meal"
            :src="assetUrl(item.meal.image)"
            :alt="item.meal.title"
            loading="lazy"
            class="h-16 w-16 shrink-0 rounded-2xl object-cover"
          />
          <span class="min-w-0">
            <span class="line-clamp-2 block text-sm font-semibold leading-snug">{{ item.meal?.title ?? item.mealId }}</span>
            <span class="text-xs text-gray-500">{{ formatMinutes(minutesOf(item.mealId)) }} · {{ formatVnd(priceOf(item.mealId, item.servings)) }}</span>
          </span>
        </RouterLink>
        <button
          type="button"
          class="shrink-0 rounded-full p-2 text-brand hover:bg-brand-soft"
          :aria-label="t('planner.swap')"
          @click="openSwap(item.index, item.mealId)"
        >
          <Icon :icon="ICONS.swapHorizontal" class="text-xl" />
        </button>
        <button
          type="button"
          class="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
          :aria-label="t('planner.removeFromPlan')"
          @click="removeMealFromDay(dayIndex, item.index)"
        >
          <Icon :icon="ICONS.trash" class="text-xl" />
        </button>
      </li>
    </ul>

    <div v-else class="rounded-3xl bg-card px-6 py-10 text-center shadow-card">
      <Icon :icon="ICONS.calendarWeek" class="mx-auto mb-3 text-5xl text-gray-300" />
      <p class="mb-4 text-gray-500">{{ t('planner.noMealsForDay', { day: dayLabel }) }}</p>
      <RouterLink :to="{ name: 'meals' }" class="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
        {{ t('planner.pickMeals') }}
      </RouterLink>
    </div>

    <!-- Swap sheet -->
    <BottomSheet v-model="swapOpen" :title="t('planner.swap')">
      <p v-if="!swapOptions.length" class="py-6 text-center text-gray-500">{{ t('planner.noSwapOptions') }}</p>
      <ul v-else class="space-y-2">
        <li v-for="option in swapOptions" :key="option.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card transition active:scale-[0.99]"
            @click="applySwap(option.id)"
          >
            <img :src="assetUrl(option.image)" :alt="option.title" loading="lazy" class="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <span class="min-w-0 flex-1">
              <span class="line-clamp-2 block text-sm font-semibold leading-snug">{{ option.title }}</span>
              <span class="text-xs text-gray-500">{{ formatMinutes(minutesOf(option.id)) }} · {{ formatVnd(priceOf(option.id)) }}</span>
            </span>
            <Icon :icon="ICONS.swapHorizontal" class="text-xl text-brand" />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </section>
</template>
