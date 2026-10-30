<script setup lang="ts">
defineProps<{ label: string }>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    class="relative h-7 w-12 shrink-0 rounded-full transition"
    :class="model ? 'bg-brand' : 'bg-gray-300'"
    @click="model = !model"
  >
    <span class="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" :class="model ? 'translate-x-5' : ''" />
  </button>
</template>
