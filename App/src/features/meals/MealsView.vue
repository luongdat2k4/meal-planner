<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import SearchField from '../../shared/ui/SearchField.vue'
import { MEAL_CATEGORIES, mealCategories } from './categories'
import { MEALS } from './meals'
import type { Meal } from './types'
import { useFavorites } from './useFavorites'

const { isFavorite, toggleFavorite } = useFavorites()

const query = ref('')
const category = ref('all')

const chips = [
  { id: 'all', label: 'Tất cả' },
  { id: 'favorites', label: '♥ Yêu thích' },
  ...MEAL_CATEGORIES.map((c) => ({ id: c.id, label: `${c.emoji} ${c.label}` })),
]

function inCategory(meal: Meal): boolean {
  if (category.value === 'all') return true
  if (category.value === 'favorites') return isFavorite(meal.id)
  return mealCategories(meal.id).some((c) => c.id === category.value)
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return MEALS.filter((meal) => inCategory(meal) && (!q || meal.title.toLowerCase().includes(q)))
})
</script>

<template>
  <section class="space-y-4">
    <SearchField v-model="query" placeholder="Tìm món ăn..." />
    <ChipTabs v-model="category" :options="chips" />

    <p class="text-sm text-gray-500">{{ filtered.length }} món</p>

    <div class="grid grid-cols-2 gap-4">
      <article v-for="meal in filtered" :key="meal.id" class="relative">
        <RouterLink
          :to="{ name: 'meal-detail', params: { id: meal.id } }"
          class="block overflow-hidden rounded-3xl bg-white shadow-card transition active:scale-[0.98]"
        >
          <div class="relative">
            <img :src="assetUrl(meal.image)" :alt="meal.title" loading="lazy" class="aspect-[4/3] w-full object-cover" />
            <span
              v-if="mealCategories(meal.id)[0]"
              class="absolute bottom-2 left-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow"
            >
              {{ mealCategories(meal.id)[0]?.label }}
            </span>
          </div>
          <div class="p-3">
            <p class="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{{ meal.title }}</p>
          </div>
        </RouterLink>

        <button
          type="button"
          class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"
          :class="isFavorite(meal.id) ? 'text-brand' : 'text-gray-400'"
          :aria-label="isFavorite(meal.id) ? 'Bỏ yêu thích' : 'Yêu thích'"
          :aria-pressed="isFavorite(meal.id)"
          @click="toggleFavorite(meal.id)"
        >
          <Icon :icon="isFavorite(meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-xl" />
        </button>
      </article>
    </div>

    <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Không tìm thấy món phù hợp.</p>
  </section>
</template>
