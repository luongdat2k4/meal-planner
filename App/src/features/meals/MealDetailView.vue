<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import { DAY_NAMES, usePlanner } from '../planner'
import { mealCategories } from './categories'
import { getMeal } from './meals'
import { useFavorites } from './useFavorites'

const props = defineProps<{ id: string }>()

const { addMealToDay } = usePlanner()
const { isFavorite, toggleFavorite } = useFavorites()

const meal = computed(() => getMeal(props.id) ?? null)
const categories = computed(() => mealCategories(props.id))

const dayOptions = DAY_NAMES.map((name, index) => ({ id: String(index), label: name }))
// Default to today (Monday = 0).
const selectedDay = ref(String((new Date().getDay() + 6) % 7))
const addedDay = ref<number | null>(null)

function addToPlan() {
  if (!meal.value) return
  const day = Number(selectedDay.value)
  addMealToDay(day, meal.value.id)
  addedDay.value = day
}
</script>

<template>
  <section v-if="meal" class="pb-32">
    <div class="relative">
      <img :src="assetUrl(meal.image)" :alt="meal.title" class="h-80 w-full object-cover" />
      <RouterLink
        :to="{ name: 'meals' }"
        class="absolute left-4 top-[max(env(safe-area-inset-top),1rem)] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
        aria-label="Quay lại"
      >
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <button
        type="button"
        class="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
        :class="isFavorite(meal.id) ? 'text-brand' : 'text-gray-500'"
        :aria-label="isFavorite(meal.id) ? 'Bỏ yêu thích' : 'Yêu thích'"
        :aria-pressed="isFavorite(meal.id)"
        @click="toggleFavorite(meal.id)"
      >
        <Icon :icon="isFavorite(meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-2xl" />
      </button>
    </div>

    <div class="relative -mt-8 space-y-5 rounded-t-[32px] bg-surface px-5 pt-6">
      <div>
        <h1 class="text-2xl font-bold leading-snug">{{ meal.title }}</h1>
        <ul v-if="categories.length" class="mt-3 flex flex-wrap gap-2">
          <li v-for="category in categories" :key="category.id" class="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {{ category.emoji }} {{ category.label }}
          </li>
        </ul>
      </div>

      <p class="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-card">
        Dữ liệu công thức và nguyên liệu chi tiết chưa được trích xuất từ app gốc.
      </p>

      <div>
        <h2 class="mb-1 font-semibold">Thêm vào kế hoạch</h2>
        <ChipTabs v-model="selectedDay" :options="dayOptions" />
      </div>

      <p v-if="addedDay !== null" class="flex items-center gap-2 rounded-2xl bg-brand-soft p-3 text-sm text-brand">
        <Icon :icon="ICONS.check" class="text-lg" />
        <span>
          Đã thêm vào {{ DAY_NAMES[addedDay] }}.
          <RouterLink :to="{ name: 'planner' }" class="font-semibold underline">Xem kế hoạch</RouterLink>
        </span>
      </p>
    </div>

    <div
      class="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl bg-gradient-to-t from-surface via-surface to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-8"
    >
      <button
        type="button"
        class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
        @click="addToPlan"
      >
        Thêm vào {{ DAY_NAMES[Number(selectedDay)] }}
      </button>
    </div>
  </section>

  <section v-else class="px-5 py-16 text-center text-gray-500">
    Không tìm thấy món này.
    <RouterLink :to="{ name: 'meals' }" class="font-semibold text-brand">Về danh sách món</RouterLink>
  </section>
</template>
