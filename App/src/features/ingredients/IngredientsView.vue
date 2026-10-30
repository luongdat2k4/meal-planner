<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
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
    <div class="relative">
      <Icon :icon="ICONS.magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
      <input
        v-model="query"
        type="search"
        placeholder="Tìm nguyên liệu..."
        class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-brand"
      />
    </div>

    <p class="text-sm text-gray-500">{{ filtered.length }} nguyên liệu</p>

    <ul class="grid grid-cols-3 gap-3 sm:grid-cols-4">
      <li
        v-for="item in filtered"
        :key="item.id"
        class="flex flex-col items-center rounded-2xl bg-white p-2.5 text-center shadow-sm ring-1 ring-black/5"
      >
        <img :src="assetUrl(item.image)" :alt="item.name" loading="lazy" class="mb-2 h-16 w-16 object-contain" />
        <span class="mb-2 text-xs font-medium leading-snug">{{ item.name }}</span>
        <button
          type="button"
          class="mt-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          :class="onList(item.name) ? 'bg-brand-soft text-brand' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          :disabled="onList(item.name)"
          @click="addShoppingItem(item.name)"
        >
          <Icon :icon="onList(item.name) ? ICONS.check : ICONS.plus" />
          {{ onList(item.name) ? 'Đã có' : 'Đi chợ' }}
        </button>
      </li>
    </ul>

    <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Không tìm thấy nguyên liệu phù hợp.</p>
  </section>
</template>
