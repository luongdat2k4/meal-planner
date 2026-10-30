<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../../shared/assets'
import { formatAmount } from '../../../shared/format'
import { ICONS } from '../../../shared/icons'
import type { RecipeIngredient } from '../types'

defineProps<{ items: RecipeIngredient[]; scale: number }>()

const emit = defineEmits<{ add: [item: RecipeIngredient] }>()
</script>

<template>
  <ul class="glass divide-y divide-gray-200/60 overflow-hidden rounded-[28px] bg-card shadow-card">
    <li v-for="item in items" :key="item.ingredientId" class="flex items-center gap-3 px-4 py-3">
      <img :src="assetUrl(item.image)" :alt="item.name" loading="lazy" class="h-10 w-10 shrink-0 object-contain" />
      <span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{{ item.name }}</span>
      <span class="shrink-0 text-sm font-semibold">{{ formatAmount(item.amount * scale, item.unit) }}</span>
      <button
        type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition active:scale-90"
        :aria-label="`Thêm ${item.name} vào danh sách đi chợ`"
        @click="emit('add', item)"
      >
        <Icon :icon="ICONS.cart" class="text-lg" />
      </button>
    </li>
  </ul>
</template>
