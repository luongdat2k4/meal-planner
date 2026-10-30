<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { t } from '../../shared/i18n'
import SearchField from '../../shared/ui/SearchField.vue'
import { useShopping } from '../shopping'
import { getIngredients } from './ingredients'

const { state, addIngredientItem } = useShopping()

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const all = getIngredients()
  return q ? all.filter((i) => i.name.toLowerCase().includes(q)) : all
})

const onList = (slug: string) => state.items.some((s) => s.ingredientSlug === slug && !s.checked)
</script>

<template>
  <section class="space-y-4">
    <SearchField v-model="query" :placeholder="t('ingredients.search')" />

    <p class="text-sm text-gray-500">{{ t('ingredients.count', { count: filtered.length }) }}</p>

    <ul class="grid grid-cols-3 gap-3">
      <li v-for="item in filtered" :key="item.id" class="flex flex-col items-center rounded-3xl bg-card p-3 text-center shadow-card">
        <img :src="assetUrl(item.image)" :alt="item.name" loading="lazy" class="mb-2 h-16 w-16 object-contain" />
        <span class="mb-3 line-clamp-2 min-h-8 text-xs font-semibold leading-snug">{{ item.name }}</span>
        <button
          type="button"
          class="mt-auto flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90"
          :class="onList(item.id) ? 'bg-brand-soft text-brand' : 'bg-brand text-white shadow shadow-brand/30'"
          :disabled="onList(item.id)"
          :aria-label="onList(item.id) ? t('ingredients.inList') : t('ingredients.addToList', { name: item.name })"
          @click="addIngredientItem(item.id)"
        >
          <Icon :icon="onList(item.id) ? ICONS.check : ICONS.plus" class="text-lg" />
        </button>
      </li>
    </ul>

    <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">{{ t('ingredients.notFound') }}</p>
  </section>
</template>
