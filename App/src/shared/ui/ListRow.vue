<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { IconifyIcon } from '@iconify/vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { ICONS } from '../icons'

defineProps<{ icon: IconifyIcon; title: string; subtitle?: string; to?: RouteLocationRaw; danger?: boolean }>()
</script>

<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to"
    class="flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 shadow-card"
    :class="to ? 'transition active:scale-[0.99]' : ''"
  >
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" :class="danger ? 'bg-red-50 text-red-600' : 'bg-brand-soft text-brand'">
      <Icon :icon="icon" class="text-2xl" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-semibold" :class="danger ? 'text-red-600' : ''">{{ title }}</span>
      <span v-if="subtitle" class="block truncate text-sm text-gray-500">{{ subtitle }}</span>
    </span>
    <slot>
      <Icon v-if="to" :icon="ICONS.chevronRight" class="text-xl text-gray-300" />
    </slot>
  </component>
</template>
