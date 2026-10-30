<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import SearchField from '../../shared/ui/SearchField.vue'
import { useShopping } from '../shopping'
import { INGREDIENTS } from './ingredients'

const { state, addShoppingItem } = useShopping()

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q)) : INGREDIENTS
})

const onList = (name: string) => state.items.some((s) => s.label === name && !s.checked)
</script>

<template>
  <section class="space-y-4">
    <SearchField v-model="query" placeholder="Tìm nguyên liệu..." />

    <p class="text-sm text-gray-500">{{ filtered.length }} nguyên liệu</p>

    <ul class="grid grid-cols-3 gap-3">
      <li v-for="item in filtered" :key="item.id" class="flex flex-col items-center rounded-3xl bg-white p-3 text-center shadow-card">
        <img :src="assetUrl(item.image)" :alt="item.name" loading="lazy" class="mb-2 h-16 w-16 object-contain" />
        <span class="mb-3 line-clamp-2 min-h-8 text-xs font-semibold leading-snug">{{ item.name }}</span>
        <button
          type="button"
          class="mt-auto flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90"
          :class="onList(item.name) ? 'bg-brand-soft text-brand' : 'bg-brand text-white shadow shadow-brand/30'"
          :disabled="onList(item.name)"
          :aria-label="onList(item.name) ? 'Đã có trong danh sách đi chợ' : `Thêm ${item.name} vào danh sách đi chợ`"
          @click="addShoppingItem(item.name)"
        >
          <Icon :icon="onList(item.name) ? ICONS.check : ICONS.plus" class="text-lg" />
        </button>
      </li>
    </ul>

    <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Không tìm thấy nguyên liệu phù hợp.</p>
  </section>
</template>
