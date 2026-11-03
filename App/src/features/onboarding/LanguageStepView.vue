<script setup lang="ts">
import { useRouter } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { saveLang, t } from '../../shared/i18n'
import LanguageList from '../../shared/ui/LanguageList.vue'
import InFeedAd from '../ads/components/InFeedAd.vue'
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
  <section class="mx-auto flex h-[calc(100dvh-var(--ad-bottom,0px))] max-w-2xl flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="flex shrink-0 items-center gap-2 font-semibold">
      <img :src="assetUrl('icon-app-tile.png')" alt="" class="h-9 w-9" />
      Meal Planner
    </header>

    <!-- Only the language list scrolls; the ad below it and the button stay in view. -->
    <main class="flex min-h-0 flex-1 flex-col pt-8">
      <!-- The heading follows the language selected below, so there is no need for a second line. -->
      <h1 class="mb-6 shrink-0 text-3xl font-semibold leading-tight">{{ t('onboarding.languageTitle') }}</h1>

      <div data-scroll-root class="-mx-2 max-h-[min(46dvh,22rem)] min-h-0 overflow-y-auto overscroll-contain px-2 py-2">
        <LanguageList />
      </div>
      <InFeedAd name="onboarding-language" :min-viewport-height="700" class="mt-4 shrink-0" />
    </main>

    <button
      type="button"
      data-ad-chrome="bottom"
      class="mt-3 w-full shrink-0 rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
      @click="next"
    >
      {{ t('onboarding.continue') }}
    </button>
  </section>
</template>
