<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ICONS } from '../icons'

defineProps<{ placeholder: string }>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="relative">
    <Icon :icon="ICONS.magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-brand" />
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      class="w-full rounded-2xl bg-white py-3.5 pl-12 pr-4 shadow-card outline-none ring-1 ring-transparent focus:ring-brand/40"
    />
  </div>
</template>
