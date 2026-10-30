<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { t } from '../i18n'
import { ICONS } from '../icons'

const props = withDefaults(defineProps<{ min?: number; max?: number }>(), { min: 1, max: 99 })

const model = defineModel<number>({ required: true })

function change(delta: number) {
  model.value = Math.min(props.max, Math.max(props.min, model.value + delta))
}
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full bg-card text-brand shadow-card disabled:opacity-40"
      :disabled="model <= min"
      :aria-label="t('ui.decrease')"
      @click="change(-1)"
    >
      <Icon :icon="ICONS.minus" class="text-xl" />
    </button>
    <span class="min-w-8 text-center text-lg font-bold">{{ model }}</span>
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow shadow-brand/30 disabled:opacity-40"
      :disabled="model >= max"
      :aria-label="t('ui.increase')"
      @click="change(1)"
    >
      <Icon :icon="ICONS.plus" class="text-xl" />
    </button>
  </div>
</template>
