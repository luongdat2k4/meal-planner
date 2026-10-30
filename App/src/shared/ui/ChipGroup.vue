<script setup lang="ts">
import type { ChipOption } from './types'

defineProps<{ options: ChipOption[] }>()

// Multi-select chips that wrap onto several lines.
const model = defineModel<string[]>({ required: true })

function toggle(id: string) {
  model.value = model.value.includes(id) ? model.value.filter((value) => value !== id) : [...model.value, id]
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      role="checkbox"
      :aria-checked="model.includes(option.id)"
      class="rounded-full px-4 py-2 text-sm font-medium transition"
      :class="model.includes(option.id) ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-white text-gray-700 shadow-card'"
      @click="toggle(option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
