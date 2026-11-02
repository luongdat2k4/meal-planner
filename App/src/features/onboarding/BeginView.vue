<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../../shared/i18n'
import { assetUrl } from '../../shared/assets'
import { showAppOpenAd, useOverlayFlag } from '../ads/adRuntime'
import InFeedAd from '../ads/components/InFeedAd.vue'
import { begin } from './begin'

// Launch screen for a returning user: a "loading ads" line while the full-screen ad loads (hidden once it is done),
// the ad itself, then a 3-2-1 countdown after which the button takes the user into the app. A banner sits at the bottom and a native ad in the
// middle. If there is no ad (offline, no fill, web) the screen moves straight on to the countdown.
const LOAD_WINDOW = 5000
const COUNTDOWN = 3

const router = useRouter()
const phase = ref<'loading' | 'countdown'>('loading')
const seconds = ref(COUNTDOWN)
// While the full-screen ad is up, the banner and native ad step aside.
const showingAd = ref(false)
useOverlayFlag(showingAd)

const ready = computed(() => phase.value === 'countdown' && seconds.value === 0)
const label = computed(() => (phase.value === 'loading' ? '' : seconds.value > 0 ? String(seconds.value) : t('begin.enter')))

let timer: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  await showAppOpenAd(LOAD_WINDOW, () => (showingAd.value = true))
  showingAd.value = false
  phase.value = 'countdown'
  timer = setInterval(() => {
    seconds.value--
    if (seconds.value <= 0) clearInterval(timer)
  }, 1000)
})

onBeforeUnmount(() => clearInterval(timer))

async function enter() {
  if (!ready.value) return
  begin.done = true
  await router.replace({ name: 'home' })
}
</script>

<template>
  <section class="mx-auto flex min-h-[calc(100dvh-var(--ad-bottom,0px))] max-w-2xl flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="flex justify-center">
      <img :src="assetUrl('icon-app-tile.png')" alt="Meal Planner" class="h-28 w-28 drop-shadow-lg" />
    </header>

    <main class="flex flex-1 flex-col justify-center gap-8 py-8">
      <div class="space-y-3 text-center">
        <h1 class="text-3xl font-semibold leading-tight">{{ t('nav.begin') }}</h1>
        <p class="min-h-6 text-gray-500">{{ phase === 'loading' ? t('begin.loading') : '' }}</p>
      </div>

      <InFeedAd name="begin" :min-viewport-height="700" />
    </main>

    <button
      type="button"
      class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:opacity-40"
      :disabled="!ready"
      @click="enter"
    >
      {{ label || '…' }}
    </button>
  </section>
</template>
