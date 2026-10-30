<script setup lang="ts">
import Stepper from '../../../shared/ui/Stepper.vue'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-2">
    <div class="text-5xl" aria-hidden="true">{{ '🧑'.repeat(Math.min(state.householdSize, 5)) }}</div>
    <Stepper v-model="state.householdSize" :min="1" :max="8" />
    <p class="text-center text-sm text-gray-500">
      {{ state.householdSize }} người ăn mỗi bữa. Khẩu phần và chi phí được nhân theo số này.
    </p>
  </div>
</template>
