<script setup lang="ts">
import { computed } from 'vue'
import type { Macros } from '../types'

const props = defineProps<{ macros: Macros }>()

const tiles = computed(() => [
  { label: 'Năng lượng', value: props.macros.calories, unit: 'kcal', emoji: '🔥' },
  { label: 'Đạm', value: props.macros.protein, unit: 'g', emoji: '💪' },
  { label: 'Tinh bột', value: props.macros.carbs, unit: 'g', emoji: '🍚' },
  { label: 'Chất béo', value: props.macros.fat, unit: 'g', emoji: '🥑' },
])
</script>

<template>
  <ul class="grid grid-cols-4 gap-2">
    <li v-for="tile in tiles" :key="tile.label" class="rounded-2xl bg-white px-1 py-3 text-center shadow-card">
      <div class="text-lg" aria-hidden="true">{{ tile.emoji }}</div>
      <div class="font-bold">{{ tile.value }}<span class="text-xs font-medium text-gray-400"> {{ tile.unit }}</span></div>
      <div class="text-[11px] text-gray-500">{{ tile.label }}</div>
    </li>
  </ul>
</template>
