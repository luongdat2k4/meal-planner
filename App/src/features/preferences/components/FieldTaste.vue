<script setup lang="ts">
import { computed } from 'vue'
import ChipGroup from '../../../shared/ui/ChipGroup.vue'
import ChipTabs from '../../../shared/ui/ChipTabs.vue'
import { t } from '../../../shared/i18n'
import { getCookTimeOptions, getProteinOptions } from '../options'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()

const proteinOptions = computed(() => getProteinOptions().map((category) => ({ id: category.id, label: `${category.emoji} ${category.label}` })))

const cookTime = computed({
  get: () => String(state.maxCookMinutes),
  set: (value: string) => {
    state.maxCookMinutes = Number(value)
  },
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h3 class="mb-2 font-semibold">{{ t('preferences.fieldTaste.protein') }}</h3>
      <ChipGroup v-model="state.proteinLikes" :options="proteinOptions" />
      <p class="mt-2 text-xs text-gray-500">{{ t('preferences.fieldTaste.anyNote') }}</p>
    </div>

    <div>
      <h3 class="mb-1 font-semibold">{{ t('preferences.fieldTaste.maxTime') }}</h3>
      <ChipTabs v-model="cookTime" :options="getCookTimeOptions()" />
    </div>
  </div>
</template>
