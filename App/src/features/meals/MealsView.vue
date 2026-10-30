<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { MEALS } from './meals'

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? MEALS.filter((m) => m.title.toLowerCase().includes(q)) : MEALS
})
</script>

<template>
  <section class="space-y-4">
    <div class="relative">
      <Icon :icon="ICONS.magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
      <input
        v-model="query"
        type="search"
        placeholder="Tìm món ăn..."
        class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-brand"
      />
    </div>

    <p class="text-sm text-gray-500">{{ filtered.length }} món</p>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <RouterLink
        v-for="meal in filtered"
        :key="meal.id"
        :to="{ name: 'meal-detail', params: { id: meal.id } }"
        class="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
      >
        <img
          :src="assetUrl(meal.image)"
          :alt="meal.title"
          loading="lazy"
          class="aspect-square w-full object-cover"
        />
        <span class="block p-2.5 text-sm font-medium leading-snug">{{ meal.title }}</span>
      </RouterLink>
    </div>

    <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Không tìm thấy món phù hợp.</p>
  </section>
</template>
