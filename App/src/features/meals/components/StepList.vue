<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ICONS } from '../../../shared/icons'

const props = defineProps<{ steps: string[] }>()

const done = ref<number[]>([])

// Switching cooking method starts a fresh checklist.
watch(
  () => props.steps,
  () => {
    done.value = []
  },
)

function toggle(index: number) {
  done.value = done.value.includes(index) ? done.value.filter((i) => i !== index) : [...done.value, index]
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm text-gray-500">Đã làm {{ done.length }}/{{ steps.length }} bước</p>
    <ol class="space-y-2">
      <li v-for="(step, index) in steps" :key="index">
        <button
          type="button"
          class="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-card"
          :aria-pressed="done.includes(index)"
          @click="toggle(index)"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="done.includes(index) ? 'bg-brand text-white' : 'bg-brand-soft text-brand'"
          >
            <Icon v-if="done.includes(index)" :icon="ICONS.check" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="text-sm leading-relaxed" :class="done.includes(index) ? 'text-gray-400 line-through' : ''">{{ step }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>
