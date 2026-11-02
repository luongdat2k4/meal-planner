<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
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

// The catalog has hundreds of meals, so the grid is windowed: only the rows near the viewport are in the DOM, and
// padding above and below stands in for the rows that are not, so the page keeps its full height and scrollbar.
// The page itself scrolls, so the window is computed from window.scrollY and the grid's position in the document.
const COLUMNS = 2
const GAP = 16
const OVERSCAN = 500
const gridHost = ref<HTMLElement | null>(null)
const grid = ref<HTMLElement | null>(null)

// Distance from one row to the next (card height + gap). Cards all have the same height, so it is measured
// from the first rendered card; until then this is a close estimate.
const pitch = ref(260)
const rowCount = computed(() => Math.ceil(filtered.value.length / COLUMNS))
const rows = ref({ start: 0, end: 6 })

const visible = computed(() => filtered.value.slice(rows.value.start * COLUMNS, rows.value.end * COLUMNS))
const padTop = computed(() => rows.value.start * pitch.value)
const padBottom = computed(() => Math.max(0, rowCount.value - rows.value.end) * pitch.value)

function updateRows() {
  const host = gridHost.value
  if (!host) return
  const card = grid.value?.querySelector('article')
  if (card && Math.abs(card.offsetHeight + GAP - pitch.value) > 0.5) pitch.value = card.offsetHeight + GAP

  const top = host.getBoundingClientRect().top + window.scrollY
  const first = Math.floor((window.scrollY - OVERSCAN - top) / pitch.value)
  const last = Math.ceil((window.scrollY + window.innerHeight + OVERSCAN - top) / pitch.value)
  const start = Math.min(Math.max(first, 0), Math.max(rowCount.value - 1, 0))
  const end = Math.min(Math.max(last, start + 1), rowCount.value)
  if (start !== rows.value.start || end !== rows.value.end) rows.value = { start, end }
}

let frame = 0
function scheduleUpdate() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    updateRows()
  })
}

function listen() {
  window.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate)
  scheduleUpdate()
}

function unlisten() {
  window.removeEventListener('scroll', scheduleUpdate)
  window.removeEventListener('resize', scheduleUpdate)
  cancelAnimationFrame(frame)
  frame = 0
}

// The screen is kept alive between tabs, so listening follows whether it is on screen.
onMounted(listen)
onActivated(listen)
onDeactivated(unlisten)
onBeforeUnmount(unlisten)

// A new filter or search changes the number of rows, and rendering rows changes the measured card height.
watch([filtered, visible, isBrowsing, showRecent], () => nextTick(scheduleUpdate))

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

      <div ref="gridHost" :style="{ paddingTop: `${padTop}px`, paddingBottom: `${padBottom}px` }">
        <div ref="grid" class="grid grid-cols-2 gap-4">
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
      </div>

      <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">{{ t('meal.list.empty') }}</p>
    </div>
  </section>
</template>
