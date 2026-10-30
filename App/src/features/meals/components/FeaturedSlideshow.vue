<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { formatMinutes } from '../../../shared/format'
import { t } from '../../../shared/i18n'
import { ICONS } from '../../../shared/icons'
import AppImage from '../../../shared/ui/AppImage.vue'
import { mealCategories } from '../categories'
import { getLevel, getRecipe } from '../recipe'
import type { Meal } from '../types'
import { useFavorites } from '../useFavorites'

const props = defineProps<{ meals: Meal[] }>()

const AUTOPLAY_MS = 4500
const SLIDE_MS = 500
const SWIPE_PX = 40

const { isFavorite, toggleFavorite } = useFavorites()

const count = computed(() => props.meals.length)
// With more than one meal the track is [copy of last, ...meals, copy of first]. Sliding onto a copy and then
// jumping, without animation, to the real card it duplicates makes the loop seamless in both directions.
const looping = computed(() => count.value > 1)
const slides = computed(() =>
  looping.value
    ? [{ meal: props.meals[count.value - 1]!, key: 'head' }, ...props.meals.map((meal) => ({ meal, key: meal.id })), { meal: props.meals[0]!, key: 'tail' }]
    : props.meals.map((meal) => ({ meal, key: meal.id })),
)

// Position in `slides`; real cards sit at 1..count when looping.
const position = ref(looping.value ? 1 : 0)
const animated = ref(true)
// The meal currently in view, as an index into `meals`.
const current = computed(() => (looping.value ? (((position.value - 1) % count.value) + count.value) % count.value : 0))

const touching = ref(false)
const hovering = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let settleTimer: ReturnType<typeof setTimeout> | undefined
let startX = 0

const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

async function jumpTo(target: number) {
  animated.value = false
  position.value = target
  await nextTick()
  // Let the browser apply the un-animated position before animation is switched back on.
  requestAnimationFrame(() => requestAnimationFrame(() => (animated.value = true)))
}

// After sliding onto a copy, hop to the identical real card.
function settle() {
  if (!looping.value) return
  if (position.value === count.value + 1) void jumpTo(1)
  else if (position.value === 0) void jumpTo(count.value)
}

function step(delta: number) {
  if (!looping.value) return
  const next = position.value + delta
  if (next < 0 || next > count.value + 1) return
  position.value = next
  clearTimeout(settleTimer)
  settleTimer = setTimeout(settle, reducedMotion ? 0 : SLIDE_MS + 30)
}

function goTo(meal: number) {
  clearTimeout(settleTimer)
  position.value = meal + 1
}

function start() {
  stop()
  if (reducedMotion || !looping.value) return
  timer = setInterval(() => {
    // Hold still while the user is looking at or touching a slide, and while the tab is in the background.
    if (!touching.value && !hovering.value && !document.hidden) step(1)
  }, AUTOPLAY_MS)
}

function stop() {
  clearInterval(timer)
  timer = undefined
}

function onTouchStart(event: TouchEvent) {
  touching.value = true
  startX = event.touches[0]?.clientX ?? 0
}

function onTouchEnd(event: TouchEvent) {
  touching.value = false
  const dx = (event.changedTouches[0]?.clientX ?? startX) - startX
  if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1)
}

const minutesOf = (mealId: string) => {
  const recipe = getRecipe(mealId)
  return recipe ? recipe.prepMinutes + recipe.cookMinutes : 0
}
const levelOf = (mealId: string) => {
  const recipe = getRecipe(mealId)
  return recipe ? t(`meal.level.${getLevel(recipe)}`) : ''
}

onMounted(start)
// The screen is kept alive between tabs, so the timer follows whether it is on screen.
onActivated(start)
onDeactivated(stop)
onBeforeUnmount(() => {
  stop()
  clearTimeout(settleTimer)
})
watch(
  () => props.meals,
  () => {
    clearTimeout(settleTimer)
    void jumpTo(looping.value ? 1 : 0)
    start()
  },
)
</script>

<template>
  <div v-if="meals.length" class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">{{ t('meal.list.suggested') }}</h2>
    </div>

    <!-- The padding leaves room for the cards' shadows inside the clipped area; the gap between slides is wider
         than that padding, so the neighbouring card never shows at the edges. -->
    <div
      class="-m-2 overflow-hidden p-2"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      @touchcancel.passive="touching = false"
    >
      <div
        class="flex gap-4"
        :class="animated ? 'transition-transform duration-500 ease-out motion-reduce:transition-none' : ''"
        :style="{ transform: `translateX(calc(${position} * (-100% - 1rem)))` }"
      >
        <article v-for="(slide, at) in slides" :key="slide.key" class="relative w-full shrink-0" :aria-hidden="at !== position">
          <RouterLink
            :to="{ name: 'meal-detail', params: { id: slide.meal.id } }"
            :tabindex="at === position ? 0 : -1"
            class="glass block rounded-[32px] bg-card p-4 text-center shadow-card transition active:scale-[0.99]"
          >
            <AppImage :src="slide.meal.image" :alt="slide.meal.title" class="aspect-[4/3] w-full rounded-3xl object-cover" />
            <h3 class="mt-3 line-clamp-1 text-xl font-semibold leading-snug">{{ slide.meal.title }}</h3>
            <p class="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
              <span class="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1"><Icon :icon="ICONS.clockOutline" /> {{ formatMinutes(minutesOf(slide.meal.id)) }}</span>
              <span class="rounded-full bg-white/80 px-3 py-1">{{ levelOf(slide.meal.id) }}</span>
              <span v-if="mealCategories(slide.meal.id)[0]" class="rounded-full bg-white/80 px-3 py-1">{{ mealCategories(slide.meal.id)[0]?.label }}</span>
            </p>
          </RouterLink>
          <button
            type="button"
            class="glass absolute left-7 top-7 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow"
            :class="isFavorite(slide.meal.id) ? 'text-brand' : 'text-gray-600'"
            :tabindex="at === position ? 0 : -1"
            :aria-label="isFavorite(slide.meal.id) ? t('meal.unfavorite') : t('meal.favorite')"
            :aria-pressed="isFavorite(slide.meal.id)"
            @click="toggleFavorite(slide.meal.id)"
          >
            <Icon :icon="isFavorite(slide.meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-xl" />
          </button>
          <span class="pointer-events-none absolute right-7 top-7 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
            <Icon :icon="ICONS.chevronRight" class="text-xl" />
          </span>
        </article>
      </div>
    </div>

    <div v-if="meals.length > 1" class="flex justify-center gap-2" role="tablist">
      <button
        v-for="(meal, at) in meals"
        :key="meal.id"
        type="button"
        role="tab"
        :aria-selected="at === current"
        :aria-label="t('meal.list.slide', { n: at + 1 })"
        class="h-2 rounded-full transition-all"
        :class="at === current ? 'w-6 bg-ink' : 'w-2 bg-gray-300'"
        @click="goTo(at); start()"
      />
    </div>
  </div>
</template>
