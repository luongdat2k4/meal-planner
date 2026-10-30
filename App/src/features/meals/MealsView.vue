<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, useRoute } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { formatMinutes } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import SearchField from '../../shared/ui/SearchField.vue'
import { swapCandidates } from '../planner'
import { getMealCategories, getMethodCategories, mealCategories } from './categories'
import { getMeal, getMeals } from './meals'
import { getLevel, getRecipe } from './recipe'
import type { CookMethod, Meal } from './types'
import { useFavorites } from './useFavorites'
import { useMealActivity } from './useMealActivity'

const route = useRoute()
const { isFavorite, toggleFavorite } = useFavorites()
const activity = useMealActivity()

const query = ref('')
const category = ref('all')
const featured = ref<Meal | null>(null)

// The home screen links here with ?filter=favorites.
watch(
  () => route.query.filter,
  (filter) => {
    if (filter === 'favorites') category.value = 'favorites'
  },
  { immediate: true },
)

// One suggestion that fits the user's preferences, picked when the screen first opens.
onMounted(() => {
  featured.value = swapCandidates('', 1)[0] ?? null
})

// Cooking devices worth filtering on; hob and oven cover nearly every meal.
const FILTER_METHODS = ['airfryer', 'microwave']

const chips = computed(() => [
  { id: 'all', label: 'Tất cả' },
  { id: 'favorites', label: '♥ Yêu thích' },
  ...[...getMealCategories(), ...getMethodCategories().filter((c) => FILTER_METHODS.includes(c.id))].map((c) => ({
    id: c.id,
    label: `${c.emoji} ${c.label}`,
  })),
])

const recentMeals = computed(() => activity.state.recent.map(getMeal).filter((meal): meal is Meal => !!meal).slice(0, 8))
const isBrowsing = computed(() => category.value === 'all' && !query.value.trim())
const showRecent = computed(() => isBrowsing.value && recentMeals.value.length > 0)

function inCategory(meal: Meal): boolean {
  if (category.value === 'all') return true
  if (category.value === 'favorites') return isFavorite(meal.id)
  if (FILTER_METHODS.includes(category.value)) return getRecipe(meal.id)?.methods.includes(category.value as CookMethod) ?? false
  return mealCategories(meal.id).some((c) => c.id === category.value)
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return getMeals().filter((meal) => inCategory(meal) && (!q || meal.title.toLowerCase().includes(q)))
})

function minutesOf(mealId: string): number {
  const recipe = getRecipe(mealId)
  return recipe ? recipe.prepMinutes + recipe.cookMinutes : 0
}

function levelOf(mealId: string): string {
  const recipe = getRecipe(mealId)
  return recipe ? getLevel(recipe) : ''
}
</script>

<template>
  <section class="space-y-5">
    <SearchField v-model="query" placeholder="Tìm món ăn..." />
    <ChipTabs v-model="category" :options="chips" />

    <!-- Featured -->
    <div v-if="isBrowsing && featured" class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Gợi ý cho bạn</h2>
      </div>
      <article class="relative">
        <RouterLink
          :to="{ name: 'meal-detail', params: { id: featured.id } }"
          class="glass block rounded-[32px] bg-card p-4 text-center shadow-card transition active:scale-[0.99]"
        >
          <img :src="assetUrl(featured.image)" :alt="featured.title" class="aspect-[4/3] w-full rounded-3xl object-cover" />
          <h3 class="mt-3 text-xl font-semibold leading-snug">{{ featured.title }}</h3>
          <p class="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
            <span class="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1"><Icon :icon="ICONS.clockOutline" /> {{ formatMinutes(minutesOf(featured.id)) }}</span>
            <span class="rounded-full bg-white/80 px-3 py-1">{{ levelOf(featured.id) }}</span>
            <span v-if="mealCategories(featured.id)[0]" class="rounded-full bg-white/80 px-3 py-1">{{ mealCategories(featured.id)[0]?.label }}</span>
          </p>
        </RouterLink>
        <button
          type="button"
          class="glass absolute left-7 top-7 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow"
          :class="isFavorite(featured.id) ? 'text-brand' : 'text-gray-600'"
          :aria-label="isFavorite(featured.id) ? 'Bỏ yêu thích' : 'Yêu thích'"
          :aria-pressed="isFavorite(featured.id)"
          @click="toggleFavorite(featured.id)"
        >
          <Icon :icon="isFavorite(featured.id) ? ICONS.heart : ICONS.heartOutline" class="text-xl" />
        </button>
        <span class="pointer-events-none absolute right-7 top-7 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
          <Icon :icon="ICONS.chevronRight" class="text-xl" />
        </span>
      </article>
    </div>

    <!-- Recently viewed -->
    <div v-if="showRecent" class="space-y-2">
      <h2 class="text-lg font-semibold">Xem gần đây</h2>
      <ul class="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li v-for="meal in recentMeals" :key="meal.id" class="w-28 shrink-0">
          <RouterLink :to="{ name: 'meal-detail', params: { id: meal.id } }" class="block">
            <img :src="assetUrl(meal.image)" :alt="meal.title" loading="lazy" class="aspect-square w-28 rounded-3xl object-cover shadow-card" />
            <span class="mt-1 line-clamp-2 block text-xs font-medium leading-snug">{{ meal.title }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <!-- Grid -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ isBrowsing ? 'Món phổ biến' : 'Kết quả' }}</h2>
        <span class="text-sm text-gray-500">{{ filtered.length }} món</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <article v-for="meal in filtered" :key="meal.id" class="relative">
          <RouterLink
            :to="{ name: 'meal-detail', params: { id: meal.id } }"
            class="glass block overflow-hidden rounded-[28px] bg-card p-2 shadow-card transition active:scale-[0.98]"
          >
            <div class="relative">
              <img :src="assetUrl(meal.image)" :alt="meal.title" loading="lazy" class="aspect-[4/3] w-full rounded-3xl object-cover" />
              <span
                v-if="mealCategories(meal.id)[0]"
                class="absolute bottom-2 left-2 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-gray-800"
              >
                {{ mealCategories(meal.id)[0]?.label }}
              </span>
            </div>
            <div class="px-1.5 pb-1.5 pt-2.5">
              <p class="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{{ meal.title }}</p>
              <p class="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Icon :icon="ICONS.clockOutline" /> {{ formatMinutes(minutesOf(meal.id)) }} · {{ levelOf(meal.id) }}
              </p>
            </div>
          </RouterLink>

          <button
            type="button"
            class="glass absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow"
            :class="isFavorite(meal.id) ? 'text-brand' : 'text-gray-600'"
            :aria-label="isFavorite(meal.id) ? 'Bỏ yêu thích' : 'Yêu thích'"
            :aria-pressed="isFavorite(meal.id)"
            @click="toggleFavorite(meal.id)"
          >
            <Icon :icon="isFavorite(meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-xl" />
          </button>
        </article>
      </div>

      <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Không tìm thấy món phù hợp.</p>
    </div>
  </section>
</template>
