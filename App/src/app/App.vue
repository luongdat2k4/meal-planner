<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useShopping } from '../features/shopping'
import { adsAvailable, adsSuppressed } from '../features/ads/adRuntime'
import BannerAd from '../features/ads/components/BannerAd.vue'
import QuickSuggestSheet from '../features/planner/components/QuickSuggestSheet.vue'
import { lang, t } from '../shared/i18n'
import { usePreferences } from '../features/preferences'
import { ICONS } from '../shared/icons'
import ToastHost from '../shared/ui/ToastHost.vue'
import { tabs } from './router'
import { syncReminders } from './reminders'
import { applyStatusBar, DEFAULT_STATUS_BAR } from './statusBar'

const route = useRoute()
const router = useRouter()
const { state: shopping } = useShopping()

// The status bar takes the colour of the current screen.
const statusBarColor = computed(() => route.meta.statusBar ?? DEFAULT_STATUS_BAR)
watch(statusBarColor, applyStatusBar, { immediate: true })

// Keep the phone's scheduled reminders in step with the settings (and the language, which the text follows).
const { state: prefs } = usePreferences()
watch(
  () => [prefs.reminder.enabled, prefs.reminder.days.join(), prefs.reminder.time, lang.value] as const,
  () => syncReminders({ enabled: prefs.reminder.enabled, days: [...prefs.reminder.days], time: prefs.reminder.time }),
  { immediate: true },
)

// Until the first navigation resolves, route.meta is empty; hold the chrome back to avoid a flash.
const ready = ref(false)
router.isReady().then(() => {
  ready.value = true
})
const showChrome = computed(() => ready.value && !route.meta.fullscreen)
const showHeader = computed(() => showChrome.value && !route.meta.hideHeader)
// The bottom banner: on routes that ask for it, and never over a sheet or the keyboard.
const shellBanner = computed(() => showChrome.value && adsAvailable.value && !!route.meta.ads?.banner && !adsSuppressed.value)

const pendingCount = computed(() => shopping.items.filter((item) => !item.checked).length)

// The suggestion button sits in the middle of the tab bar.
const leftTabs = computed(() => tabs.slice(0, 2))
const rightTabs = computed(() => tabs.slice(2))
const suggestOpen = ref(false)

// Tab screens keep their state (search text, scroll) while switching tabs.
const cachedViews = ['HomeView', 'MealsView', 'PlannerView', 'ShoppingView']

// Only the area between the title and the tab bar scrolls (`main`, marked data-scroll-root); the header and the tab
// bar stay put. Tab screens come back at the scroll position they were left at, other screens start at the top.
const scroller = ref<HTMLElement | null>(null)
const scrollPositions = new Map<string, number>()
router.beforeEach((_to, from) => {
  if (scroller.value) scrollPositions.set(from.fullPath, scroller.value.scrollTop)
})
router.afterEach((to) => {
  void nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = to.meta.tab ? (scrollPositions.get(to.fullPath) ?? 0) : 0
  })
})
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col" :class="showChrome ? 'h-dvh overflow-hidden' : 'min-h-dvh'">
    <!-- Paints the status bar area when the app is drawn edge to edge (no height where there is no status bar). -->
    <div
      data-ad-chrome="top"
      class="pointer-events-none fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] transition-colors duration-300"
      :style="{ backgroundColor: statusBarColor }"
      aria-hidden="true"
    />

    <header v-if="showHeader" data-ad-chrome="top" class="flex shrink-0 items-center gap-2 px-5 pb-[15px] pt-[max(env(safe-area-inset-top),1rem)]">
      <RouterLink
        v-if="route.meta.backTo"
        :to="route.meta.backTo"
        class="-ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
        :aria-label="t('nav.back')"
      >
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <h1 class="text-2xl font-semibold tracking-tight">{{ route.meta.title ? t(route.meta.title) : '' }}</h1>
    </header>

    <!-- Profile and settings button: fixed, so it stays put while a tab screen scrolls. The negative margin centres
         the 44px button on the 32px title line of the header. -->
    <div
      v-if="showChrome && route.meta.tab"
      data-ad-chrome="top"
      class="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto flex max-w-2xl justify-end px-5 pt-[max(env(safe-area-inset-top),1rem)]"
    >
      <RouterLink
        :to="{ name: 'settings' }"
        class="pointer-events-auto -mt-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card"
        :aria-label="t('nav.profile')"
      >
        <Icon :icon="ICONS.accountCircle" class="text-3xl text-gray-700" />
      </RouterLink>
    </div>

    <main
      ref="scroller"
      data-scroll-root
      class="flex-1"
      :class="showChrome ? (showHeader ? 'min-h-0 overflow-y-auto overscroll-contain px-5 pb-6 pt-3' : 'min-h-0 overflow-y-auto overscroll-contain px-5 pb-6') : ''"
    >
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="cachedViews">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <nav v-if="showChrome" data-ad-chrome="bottom" class="z-30 w-full shrink-0 px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
      <ul class="flex items-center justify-between rounded-full bg-white p-2 shadow-[0_12px_36px_rgb(70_80_140/0.18)] ring-1 ring-white/70">
        <li v-for="tab in leftTabs" :key="tab.name">
          <RouterLink :to="{ name: tab.name }" custom v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              :aria-label="t(tab.label)"
              :title="t(tab.label)"
              :aria-current="isActive ? 'page' : undefined"
              class="flex h-12 w-12 items-center justify-center rounded-full transition"
              :class="isActive ? 'bg-brand text-white shadow-lg shadow-brand/40' : 'bg-slate-100 text-gray-700'"
              @click="navigate"
            >
              <Icon :icon="tab.icon" class="text-2xl" />
            </a>
          </RouterLink>
        </li>

        <li>
          <button
            type="button"
            :aria-label="t('nav.quickSuggest')"
            :title="t('nav.quickSuggest')"
            class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 via-violet-200 to-sky-300 text-gray-900 shadow-md ring-2 ring-white/80 transition active:scale-95"
            @click="suggestOpen = true"
          >
            <Icon :icon="ICONS.autoFix" class="text-2xl" />
          </button>
        </li>

        <li v-for="tab in rightTabs" :key="tab.name">
          <RouterLink :to="{ name: tab.name }" custom v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              :aria-label="t(tab.label)"
              :title="t(tab.label)"
              :aria-current="isActive ? 'page' : undefined"
              class="relative flex h-12 w-12 items-center justify-center rounded-full transition"
              :class="isActive ? 'bg-brand text-white shadow-lg shadow-brand/40' : 'bg-slate-100 text-gray-700'"
              @click="navigate"
            >
              <Icon :icon="tab.icon" class="text-2xl" />
              <span
                v-if="tab.name === 'shopping' && pendingCount"
                class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white"
              >
                {{ pendingCount > 99 ? '99+' : pendingCount }}
              </span>
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- Room for the banner, which the SDK draws over the bottom edge of the screen. -->
    <div v-if="showChrome" class="h-[var(--ad-bottom,0px)] shrink-0 transition-[height] duration-200" aria-hidden="true" />

    <BannerAd v-if="shellBanner" />
    <QuickSuggestSheet v-model="suggestOpen" />
    <ToastHost />
  </div>
</template>
