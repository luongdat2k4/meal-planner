<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { useDragScroll } from '../dragScroll'
import type { ChipOption } from './types'

defineProps<{ options: ChipOption[] }>()

const model = defineModel<string>({ required: true })
const list = useTemplateRef<HTMLElement>('list')

useDragScroll(list)

// Keep the selected chip visible without moving the row more than needed. A chip the user just tapped is already
// on screen, so it never makes the row jump; only a chip that is cut off (or off screen) is scrolled into view.
const EDGE = 20 // the row's side padding

function revealSelected(behavior: ScrollBehavior) {
  const row = list.value
  const chip = row?.querySelector<HTMLElement>('[aria-selected="true"]')
  if (!row || !chip) return
  const rowBox = row.getBoundingClientRect()
  const chipBox = chip.getBoundingClientRect()
  const left = chipBox.left - rowBox.left + row.scrollLeft - EDGE
  const right = chipBox.right - rowBox.left + row.scrollLeft + EDGE
  if (left < row.scrollLeft) row.scrollTo({ left: Math.max(0, left), behavior })
  else if (right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: right - row.clientWidth, behavior })
}

// On first show the chip jumps into place; later changes (not caused by a tap) glide.
onMounted(() => revealSelected('instant'))
watch(model, async () => {
  await nextTick()
  revealSelected('smooth')
})
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
