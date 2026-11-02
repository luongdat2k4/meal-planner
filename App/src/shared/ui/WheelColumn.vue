<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// One scroll wheel of a picker: a vertical list that snaps so the chosen row sits in the middle band.
// The model is the index of the chosen option.
const props = defineProps<{ options: string[]; label: string }>()
const model = defineModel<number>({ required: true })

const ROW = 44
const HEIGHT = 220
const list = ref<HTMLElement>()
let frame = 0

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    const index = Math.round((list.value?.scrollTop ?? 0) / ROW)
    model.value = Math.min(Math.max(index, 0), props.options.length - 1)
  })
}

function choose(index: number) {
  list.value?.scrollTo({ top: index * ROW, behavior: 'smooth' })
}

// Keyboard: arrows move one row, which the scroll handler then picks up.
function onKey(event: KeyboardEvent) {
  const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
  if (!step) return
  event.preventDefault()
  choose(Math.min(Math.max(model.value + step, 0), props.options.length - 1))
}

onMounted(() => {
  if (list.value) list.value.scrollTop = model.value * ROW
})
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <div
    ref="list"
    class="snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    :style="{ height: `${HEIGHT}px`, paddingBlock: `${(HEIGHT - ROW) / 2}px` }"
    role="listbox"
    tabindex="0"
    :aria-label="label"
    @scroll.passive="onScroll"
    @keydown="onKey"
  >
    <button
      v-for="(option, index) in options"
      :key="option"
      type="button"
      role="option"
      :aria-selected="index === model"
      tabindex="-1"
      class="flex w-full snap-center items-center justify-center text-2xl tabular-nums transition"
      :class="index === model ? 'font-bold text-gray-900' : 'text-gray-400'"
      :style="{ height: `${ROW}px` }"
      @click="choose(index)"
    >
      {{ option }}
    </button>
  </div>
</template>
