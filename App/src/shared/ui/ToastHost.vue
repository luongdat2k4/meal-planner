<script setup lang="ts">
import { useToasts } from '../toast'

const toasts = useToasts()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
    <TransitionGroup
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-3 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
      >
        {{ toast.message }}
        <button v-if="toast.action" type="button" class="font-semibold text-sky-300 underline" @click="toast.action.onClick()">
          {{ toast.action.label }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
