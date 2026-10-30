<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { useDragScroll } from '../dragScroll'
import type { ChipOption } from './types'

defineProps<{ options: ChipOption[] }>()

const model = defineModel<string>({ required: true })
const list = useTemplateRef<HTMLElement>('list')

useDragScroll(list)

// Keep the selected chip visible in the horizontal scroller.
async function revealSelected() {
  await nextTick()
  list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
}

onMounted(revealSelected)
watch(model, revealSelected)
</script>

<template>
  <div
    ref="list"
    class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    role="tablist"
  >
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      role="tab"
      :aria-selected="model === option.id"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
      :class="model === option.id ? 'bg-ink text-white shadow-md shadow-black/20' : 'bg-card text-gray-700 shadow-card'"
      @click="model = option.id"
    >
      {{ option.label }}
    </button>
  </div>
</template>
