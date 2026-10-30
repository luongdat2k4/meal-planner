<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { t } from '../i18n'
import { ICONS } from '../icons'

const model = defineModel<number>({ default: 0 })
</script>

<template>
  <div class="flex gap-1" role="radiogroup" :aria-label="t('ui.rating')">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      role="radio"
      :aria-checked="model === n"
      :aria-label="t('ui.stars', { n })"
      class="text-3xl transition active:scale-90"
      :class="n <= model ? 'text-amber-400' : 'text-gray-300'"
      @click="model = model === n ? 0 : n"
    >
      <Icon :icon="n <= model ? ICONS.star : ICONS.starOutline" />
    </button>
  </div>
</template>
