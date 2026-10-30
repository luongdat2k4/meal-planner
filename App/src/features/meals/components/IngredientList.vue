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
  <ul class="space-y-2">
    <li v-for="item in items" :key="item.ingredientId" class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
      <img :src="assetUrl(item.image)" :alt="item.name" loading="lazy" class="h-11 w-11 shrink-0 object-contain" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ item.name }}</span>
        <span class="text-xs text-gray-500">{{ formatAmount(item.amount * scale, item.unit) }}</span>
      </span>
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
