<script setup lang="ts">
import { computed } from 'vue'
import type { Macros } from '../types'

const props = defineProps<{ macros: Macros }>()

const tiles = computed(() => [
  { label: 'Năng lượng', value: props.macros.calories, unit: 'kcal', emoji: '🔥', color: 'bg-tile-pink' },
  { label: 'Đạm', value: props.macros.protein, unit: 'g', emoji: '💪', color: 'bg-tile-blue' },
  { label: 'Tinh bột', value: props.macros.carbs, unit: 'g', emoji: '🍚', color: 'bg-tile-yellow' },
  { label: 'Chất béo', value: props.macros.fat, unit: 'g', emoji: '🥑', color: 'bg-tile-green' },
])
</script>

<template>
  <ul class="grid grid-cols-4 gap-2">
    <li v-for="tile in tiles" :key="tile.label" class="rounded-3xl px-1 py-3 text-center" :class="tile.color">
      <div class="text-lg" aria-hidden="true">{{ tile.emoji }}</div>
      <div class="font-semibold">{{ tile.value }}<span class="text-xs font-medium text-gray-500"> {{ tile.unit }}</span></div>
      <div class="text-[11px] text-gray-600">{{ tile.label }}</div>
    </li>
  </ul>
</template>
