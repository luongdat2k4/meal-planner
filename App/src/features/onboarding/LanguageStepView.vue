<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { saveLang, t } from '../../shared/i18n'
import { ICONS } from '../../shared/icons'
import LanguageList from '../../shared/ui/LanguageList.vue'
import { usePreferences } from '../preferences'

const router = useRouter()
const { completeLanguage } = usePreferences()

async function next() {
  // Confirms the language the app shows now, even if the user did not change it.
  saveLang()
  completeLanguage()
  await router.replace({ name: 'onboarding' })
}
</script>

<template>
  <section class="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="flex items-center gap-2 font-semibold">
      <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
        <Icon :icon="ICONS.silverware" class="text-xl" />
      </span>
      Meal Planner
    </header>

    <main class="flex-1 py-8">
      <!-- The heading follows the language selected below, so there is no need for a second line. -->
      <h1 class="mb-8 text-3xl font-semibold leading-tight">{{ t('onboarding.languageTitle') }}</h1>

      <LanguageList />
    </main>

    <button
      type="button"
      class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
      @click="next"
    >
      {{ t('onboarding.continue') }}
    </button>
  </section>
</template>
