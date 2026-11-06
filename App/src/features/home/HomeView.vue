<script setup lang="ts">
import { computed, onDeactivated, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { formatMinutes } from '../../shared/format'
import { t } from '../../shared/i18n'
import { ICONS } from '../../shared/icons'
import { getMeal, getMeals, getRecipe, useFavorites } from '../meals'
import { dayNames, usePlanner } from '../planner'
import { useShopping } from '../shopping'
import AppImage from '../../shared/ui/AppImage.vue'
import SearchField from '../../shared/ui/SearchField.vue'
import { useOverlayFlag } from '../ads/adRuntime'
import InFeedAd from '../ads/components/InFeedAd.vue'

const { state: planner, plannedMealCount } = usePlanner()
const { state: favorites } = useFavorites()
const { state: shopping } = useShopping()

// Monday = 0.
const today = (new Date().getDay() + 6) % 7

// Search right here: typing opens a list of matches under the field, so nobody has to leave the screen to look for a meal.
const SEARCH_LIMIT = 8
const query = ref('')
const focused = ref(false)
let blurTimer: ReturnType<typeof setTimeout> | undefined
const trimmed = computed(() => query.value.trim().toLowerCase())
const searchOpen = computed(() => focused.value && trimmed.value !== '')
const matches = computed(() => (trimmed.value ? getMeals().filter((meal) => meal.title.toLowerCase().includes(trimmed.value)) : []))
const shownMatches = computed(() => matches.value.slice(0, SEARCH_LIMIT))
// The list sits above the page: a native ad view would be drawn over it.
useOverlayFlag(searchOpen)

function onFocus() {
  clearTimeout(blurTimer)
  focused.value = true
}
// Closing waits a moment so a tap on a result still lands before the list goes away.
function onBlur() {
  blurTimer = setTimeout(() => (focused.value = false), 150)
}
onDeactivated(() => {
  query.value = ''
  focused.value = false
})

const pendingCount = computed(() => shopping.items.filter((item) => !item.checked).length)

const todayMeals = computed(() =>
  (planner.plan[today] ?? []).map((mealId) => {
    const recipe = getRecipe(mealId)
    return { mealId, meal: getMeal(mealId), minutes: recipe ? recipe.prepMinutes + recipe.cookMinutes : 0 }
  }),
)

const tiles = computed(() => [
  { label: t('home.tilePlan'), value: plannedMealCount.value, hint: t('home.tilePlanHint'), icon: ICONS.calendarWeek, color: 'bg-tile-blue', to: { name: 'planner' } },
  { label: t('home.tileFavorites'), value: favorites.ids.length, hint: t('home.tileFavoritesHint'), icon: ICONS.heart, color: 'bg-tile-lilac', to: { name: 'meals', query: { filter: 'favorites' } } },
  { label: t('home.tileShopping'), value: pendingCount.value, hint: t('home.tileShoppingHint'), icon: ICONS.cart, color: 'bg-tile-cyan', to: { name: 'shopping' } },
])
</script>

<template>
  <section class="space-y-6 pt-[max(env(safe-area-inset-top),1.25rem)]">
    <header class="flex items-start justify-between gap-3">
      <div>
        <p class="text-gray-600">{{ t('home.greeting') }}</p>
        <h1 class="mt-1 text-4xl font-semibold leading-tight tracking-tight">{{ t('home.titleLine1') }}<br />{{ t('home.titleLine2') }}</h1>
      </div>
    </header>

    <div class="relative z-30" @focusin="onFocus" @focusout="onBlur">
      <SearchField v-model="query" :placeholder="t('home.search')" />
      <div
        v-if="searchOpen"
        class="absolute inset-x-0 top-full mt-2 max-h-[55dvh] overflow-y-auto overscroll-contain rounded-3xl bg-surface/95 p-2 shadow-card glass"
      >
        <ul v-if="shownMatches.length">
          <li v-for="meal in shownMatches" :key="meal.id">
            <RouterLink :to="{ name: 'meal-detail', params: { id: meal.id } }" class="flex items-center gap-3 rounded-2xl p-2 transition active:bg-white/70">
              <AppImage thumb :src="meal.image" :alt="meal.title" class="h-12 w-12 shrink-0 rounded-xl object-cover" />
              <span class="line-clamp-2 text-sm font-semibold leading-snug">{{ meal.title }}</span>
            </RouterLink>
          </li>
          <li v-if="matches.length > shownMatches.length">
            <RouterLink :to="{ name: 'meals', query: { q: query.trim() } }" class="block rounded-2xl p-3 text-center text-sm font-semibold text-brand">
              {{ t('home.viewAll') }} · {{ t('meal.list.count', { count: matches.length }) }}
            </RouterLink>
          </li>
        </ul>
        <p v-else class="px-4 py-6 text-center text-sm text-gray-500">{{ t('meal.list.empty') }}</p>
      </div>
    </div>

    <div class="space-y-3 rounded-[28px] bg-card p-4 shadow-card">
      <h2 class="flex items-center gap-2 px-1 font-semibold">
        <Icon :icon="ICONS.calendarWeek" class="text-xl" /> {{ t('home.weekGlance') }}
      </h2>
      <ul class="grid grid-cols-3 gap-2">
        <li v-for="tile in tiles" :key="tile.label">
          <RouterLink :to="tile.to" class="flex h-full flex-col gap-2 rounded-3xl p-3 transition active:scale-[0.98]" :class="tile.color">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
              <Icon :icon="tile.icon" class="text-lg text-gray-700" />
            </span>
            <span class="text-sm text-gray-600">{{ tile.label }}</span>
            <span class="text-3xl font-semibold leading-none">{{ tile.value }}</span>
            <span class="text-[11px] text-gray-500">{{ tile.hint }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ t('home.todayPlan') }}</h2>
        <RouterLink :to="{ name: 'planner' }" class="text-sm text-gray-500">{{ t('home.viewAll') }}</RouterLink>
      </div>

      <ul v-if="todayMeals.length" class="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li v-for="(item, index) in todayMeals" :key="`${item.mealId}-${index}`" class="w-52 shrink-0">
          <RouterLink
            :to="{ name: 'meal-detail', params: { id: item.mealId } }"
            class="block rounded-[28px] bg-card p-3 text-center shadow-card transition active:scale-[0.98]"
          >
            <span class="mb-2 inline-block rounded-full bg-white/80 px-3 py-0.5 text-xs text-gray-600">{{ dayNames()[today] }}</span>
            <AppImage v-if="item.meal" thumb :src="item.meal.image" :alt="item.meal.title" class="aspect-[4/3] w-full rounded-2xl object-cover" />
            <span class="mt-2 line-clamp-2 block min-h-10 text-sm font-semibold leading-snug">{{ item.meal?.title ?? item.mealId }}</span>
            <span class="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Icon :icon="ICONS.clockOutline" /> {{ formatMinutes(item.minutes) }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <div v-else class="rounded-[28px] bg-card px-6 py-8 text-center shadow-card">
        <p class="mb-4 text-gray-500">{{ t('home.noMealsToday') }}</p>
        <RouterLink :to="{ name: 'planner' }" class="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/30">
          {{ t('home.makePlan') }}
        </RouterLink>
      </div>
    </div>

    <InFeedAd name="home" />
  </section>
</template>
