<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatMinutes } from '../../shared/format'
import { t } from '../../shared/i18n'
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
import AppImage from '../../shared/ui/AppImage.vue'
import FeaturedSlideshow from './components/FeaturedSlideshow.vue'

const route = useRoute()
const { isFavorite, toggleFavorite } = useFavorites()
const activity = useMealActivity()

const query = ref('')
const category = ref('all')
const featuredMeals = ref<Meal[]>([])

// The home screen links here with ?filter=favorites.
watch(
  () => route.query.filter,
  (filter) => {
    if (filter === 'favorites') category.value = 'favorites'
  },
  { immediate: true },
)

// Suggestions that fit the user's preferences. The screen is kept alive between tabs, so they are picked each
// time it is shown again: leaving the screen and coming back gives a fresh set of five.
onActivated(() => {
  featuredMeals.value = swapCandidates('', 5)
})

// Cooking devices worth filtering on; hob and oven cover nearly every meal.
const FILTER_METHODS = ['airfryer', 'microwave']

const chips = computed(() => [
  { id: 'all', label: t('meal.chips.all') },
  { id: 'favorites', label: t('meal.chips.favorites') },
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

// The catalog has hundreds of meals, so the grid shows them a few at a time: the next batch is added when
// the placeholder at the bottom nears the viewport. Changing the filter or search starts over from the first batch.
const BATCH = 12
const shown = ref(BATCH)
const visible = computed(() => filtered.value.slice(0, shown.value))
const hasMore = computed(() => shown.value < filtered.value.length)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let loadTimer: ReturnType<typeof setTimeout> | undefined

watch([category, query], () => {
  shown.value = BATCH
})

function loadMore() {
  if (!hasMore.value || loadTimer) return
  // A short beat keeps the shimmer visible and lets the browser paint between batches.
  loadTimer = setTimeout(() => {
    loadTimer = undefined
    shown.value += BATCH
    // The placeholder may still be in view after the new batch; observe it again so the next batch follows.
    if (sentinel.value && observer) {
      observer.unobserve(sentinel.value)
      observer.observe(sentinel.value)
    }
  }, 120)
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && loadMore(), { rootMargin: '600px 0px' })
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(loadTimer)
})

function minutesOf(mealId: string): number {
  const recipe = getRecipe(mealId)
  return recipe ? recipe.prepMinutes + recipe.cookMinutes : 0
}

function levelOf(mealId: string): string {
  const recipe = getRecipe(mealId)
  return recipe ? t(`meal.level.${getLevel(recipe)}`) : ''
}
</script>

<template>
  <section class="space-y-5">
    <SearchField v-model="query" :placeholder="t('meal.search.placeholder')" />
    <ChipTabs v-model="category" :options="chips" />

    <!-- Featured: a few suggestions that fit the user's preferences, shown as a slideshow -->
    <FeaturedSlideshow v-if="isBrowsing" :meals="featuredMeals" />

    <!-- Recently viewed -->
    <div v-if="showRecent" class="space-y-2">
      <h2 class="text-lg font-semibold">{{ t('meal.list.recent') }}</h2>
      <ul class="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li v-for="meal in recentMeals" :key="meal.id" class="w-28 shrink-0">
          <RouterLink :to="{ name: 'meal-detail', params: { id: meal.id } }" class="block">
            <AppImage :src="meal.image" :alt="meal.title" loading="lazy" class="aspect-square w-28 rounded-3xl object-cover shadow-card" />
            <span class="mt-1 line-clamp-2 block text-xs font-medium leading-snug">{{ meal.title }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <!-- Grid -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ isBrowsing ? t('meal.list.popular') : t('meal.list.results') }}</h2>
        <span class="text-sm text-gray-500">{{ t('meal.list.count', { count: filtered.length }) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <article v-for="meal in visible" :key="meal.id" class="relative">
          <RouterLink
            :to="{ name: 'meal-detail', params: { id: meal.id } }"
            class="glass block overflow-hidden rounded-[28px] bg-card p-2 shadow-card transition active:scale-[0.98]"
          >
            <div class="relative">
              <AppImage :src="meal.image" :alt="meal.title" loading="lazy" class="aspect-[4/3] w-full rounded-3xl object-cover" />
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
            :aria-label="isFavorite(meal.id) ? t('meal.unfavorite') : t('meal.favorite')"
            :aria-pressed="isFavorite(meal.id)"
            @click="toggleFavorite(meal.id)"
          >
            <Icon :icon="isFavorite(meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-xl" />
          </button>
        </article>
      </div>

      <!-- Placeholders for the next batch; they also mark where to load more. -->
      <div v-show="hasMore" ref="sentinel" class="grid grid-cols-2 gap-4" aria-hidden="true">
        <div v-for="n in 2" :key="n" class="rounded-[28px] bg-card p-2 shadow-card">
          <div class="skeleton aspect-[4/3] w-full rounded-3xl" />
          <div class="space-y-2 px-1.5 pb-2 pt-3">
            <div class="skeleton h-3.5 w-11/12 rounded-full" />
            <div class="skeleton h-3.5 w-2/3 rounded-full" />
          </div>
        </div>
      </div>

      <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">{{ t('meal.list.empty') }}</p>
    </div>
  </section>
</template>
