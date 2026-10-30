<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { formatMinutes } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import { getMeal, getRecipe, useFavorites } from '../meals'
import { DAY_NAMES, usePlanner } from '../planner'
import { useShopping } from '../shopping'

const { state: planner, plannedMealCount } = usePlanner()
const { state: favorites } = useFavorites()
const { state: shopping } = useShopping()

// Monday = 0.
const today = (new Date().getDay() + 6) % 7

const greeting = 'Xin chào bạn 👋'
const pendingCount = computed(() => shopping.items.filter((item) => !item.checked).length)

const todayMeals = computed(() =>
  (planner.plan[today] ?? []).map((mealId) => {
    const recipe = getRecipe(mealId)
    return { mealId, meal: getMeal(mealId), minutes: recipe ? recipe.prepMinutes + recipe.cookMinutes : 0 }
  }),
)

const tiles = computed(() => [
  { label: 'Kế hoạch', value: plannedMealCount.value, hint: 'món trong tuần', icon: ICONS.calendarWeek, color: 'bg-tile-blue', to: { name: 'planner' } },
  { label: 'Yêu thích', value: favorites.ids.length, hint: 'món đã lưu', icon: ICONS.heart, color: 'bg-tile-lilac', to: { name: 'meals', query: { filter: 'favorites' } } },
  { label: 'Đi chợ', value: pendingCount.value, hint: 'món cần mua', icon: ICONS.cart, color: 'bg-tile-cyan', to: { name: 'shopping' } },
])
</script>

<template>
  <section class="space-y-6 pt-[max(env(safe-area-inset-top),1.25rem)]">
    <header class="flex items-start justify-between gap-3">
      <div>
        <p class="text-gray-600">{{ greeting }}</p>
        <h1 class="mt-1 text-4xl font-semibold leading-tight tracking-tight">Hôm nay<br />ăn gì?</h1>
      </div>
    </header>

    <RouterLink :to="{ name: 'meals' }" class="glass flex items-center gap-3 rounded-full bg-card px-5 py-4 text-gray-500 shadow-card">
      <Icon :icon="ICONS.autoFix" class="text-xl text-brand" />
      Tìm món ăn...
    </RouterLink>

    <div class="glass space-y-3 rounded-[28px] bg-card p-4 shadow-card">
      <h2 class="flex items-center gap-2 px-1 font-semibold">
        <Icon :icon="ICONS.calendarWeek" class="text-xl" /> Tuần này nhìn nhanh
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
        <h2 class="text-lg font-semibold">Kế hoạch hôm nay</h2>
        <RouterLink :to="{ name: 'planner' }" class="text-sm text-gray-500">Xem tất cả</RouterLink>
      </div>

      <ul v-if="todayMeals.length" class="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li v-for="(item, index) in todayMeals" :key="`${item.mealId}-${index}`" class="w-52 shrink-0">
          <RouterLink
            :to="{ name: 'meal-detail', params: { id: item.mealId } }"
            class="glass block rounded-[28px] bg-card p-3 text-center shadow-card transition active:scale-[0.98]"
          >
            <span class="mb-2 inline-block rounded-full bg-white/80 px-3 py-0.5 text-xs text-gray-600">{{ DAY_NAMES[today] }}</span>
            <img v-if="item.meal" :src="assetUrl(item.meal.image)" :alt="item.meal.title" class="aspect-[4/3] w-full rounded-2xl object-cover" />
            <span class="mt-2 line-clamp-2 block min-h-10 text-sm font-semibold leading-snug">{{ item.meal?.title ?? item.mealId }}</span>
            <span class="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Icon :icon="ICONS.clockOutline" /> {{ formatMinutes(item.minutes) }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <div v-else class="glass rounded-[28px] bg-card px-6 py-8 text-center shadow-card">
        <p class="mb-4 text-gray-500">Hôm nay bạn chưa có món nào trong kế hoạch.</p>
        <RouterLink :to="{ name: 'planner' }" class="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/30">
          Lên kế hoạch
        </RouterLink>
      </div>
    </div>
  </section>
</template>
