<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import { t } from '../../shared/i18n'
import { regeneratePlan } from '../planner'
import FieldDiet from './components/FieldDiet.vue'
import FieldHousehold from './components/FieldHousehold.vue'
import FieldReminder from './components/FieldReminder.vue'
import FieldSchedule from './components/FieldSchedule.vue'
import FieldTaste from './components/FieldTaste.vue'
import { usePreferences } from './usePreferences'

const router = useRouter()
const { state, completeSetup } = usePreferences()

const steps = [{ key: 'household' }, { key: 'diet' }, { key: 'taste' }, { key: 'schedule' }, { key: 'reminder' }] as const

const step = ref(Math.min(state.setupStep, steps.length - 1))
const generating = ref(false)

watch(step, (value) => {
  state.setupStep = value
})

const current = computed(() => steps[step.value])
const isLast = computed(() => step.value === steps.length - 1)
const canContinue = computed(() => current.value.key !== 'schedule' || state.cookingDays.length > 0)

async function next() {
  if (!isLast.value) {
    step.value++
    return
  }
  generating.value = true
  // Short pause so the plan "generation" feels intentional.
  await new Promise((resolve) => setTimeout(resolve, 1100))
  regeneratePlan()
  completeSetup()
  showToast(t('setup.ready'))
  await router.replace({ name: 'planner' })
}

function skip() {
  completeSetup()
  router.replace({ name: 'home' })
}
</script>

<template>
  <section class="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="flex items-center gap-3">
      <button
        v-if="step > 0"
        type="button"
        class="-ml-1 rounded-full p-1 text-gray-600 hover:bg-gray-200"
        :aria-label="t('setup.back')"
        @click="step--"
      >
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </button>
      <div class="flex flex-1 gap-1.5" role="progressbar" :aria-valuenow="step + 1" :aria-valuemax="steps.length">
        <span v-for="(item, index) in steps" :key="item.key" class="h-1.5 flex-1 rounded-full" :class="index <= step ? 'bg-brand' : 'bg-gray-200'" />
      </div>
      <button type="button" class="text-sm font-medium text-gray-500" @click="skip">{{ t('setup.skip') }}</button>
    </header>

    <main class="flex-1 py-8">
      <h1 class="mb-1 text-2xl font-bold leading-tight">{{ t(`setup.steps.${current.key}.title`) }}</h1>
      <p class="mb-6 text-gray-500">{{ t(`setup.steps.${current.key}.subtitle`) }}</p>
      <FieldHousehold v-if="current.key === 'household'" />
      <FieldDiet v-else-if="current.key === 'diet'" />
      <FieldTaste v-else-if="current.key === 'taste'" />
      <FieldSchedule v-else-if="current.key === 'schedule'" />
      <FieldReminder v-else-if="current.key === 'reminder'" />
    </main>

    <button
      type="button"
      class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:opacity-40"
      :disabled="!canContinue || generating"
      @click="next"
    >
      {{ isLast ? t('setup.create') : t('setup.continue') }}
    </button>

    <div v-if="generating" class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      <p class="font-semibold">{{ t('setup.generating') }}</p>
    </div>
  </section>
</template>
