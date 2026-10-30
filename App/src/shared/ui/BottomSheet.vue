<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ICONS } from '../icons'

defineProps<{ title: string }>()

const open = defineModel<boolean>({ required: true })

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="open = false">
      <div
        class="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] bg-surface/95 glass p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">{{ title }}</h2>
          <button type="button" class="rounded-full p-1 text-gray-500 hover:bg-gray-200" aria-label="Đóng" @click="open = false">
            <Icon :icon="ICONS.close" class="text-2xl" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
