<script setup lang="ts">
import { ref } from 'vue'
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
const { state } = usePreferences()

const generating = ref(false)

async function regenerate() {
  generating.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  regeneratePlan()
  generating.value = false
  showToast(t('preferences.regenerated'))
  await router.push({ name: 'planner' })
}
</script>

<template>
  <section class="space-y-4">
    <p class="text-sm text-gray-500">{{ t('preferences.intro') }}</p>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-3 font-bold">{{ t('preferences.household') }}</h2>
      <FieldHousehold />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">{{ t('preferences.diet') }}</h2>
      <FieldDiet />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">{{ t('preferences.taste') }}</h2>
      <FieldTaste />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">{{ t('preferences.schedule') }}</h2>
      <FieldSchedule />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">{{ t('preferences.reminder') }}</h2>
      <FieldReminder />
    </article>

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:opacity-40"
      :disabled="generating || !state.cookingDays.length"
      @click="regenerate"
    >
      <Icon :icon="ICONS.autoFix" class="text-xl" />
      {{ generating ? t('preferences.generating') : t('preferences.save') }}
    </button>
  </section>
</template>
