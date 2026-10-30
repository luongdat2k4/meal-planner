<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useShopping } from '../features/shopping'
import QuickSuggestSheet from '../features/planner/components/QuickSuggestSheet.vue'
import { t } from '../shared/i18n'
import { ICONS } from '../shared/icons'
import ToastHost from '../shared/ui/ToastHost.vue'
import { tabs } from './router'

const route = useRoute()
const router = useRouter()
const { state: shopping } = useShopping()

// Until the first navigation resolves, route.meta is empty; hold the chrome back to avoid a flash.
const ready = ref(false)
router.isReady().then(() => {
  ready.value = true
})
const showChrome = computed(() => ready.value && !route.meta.fullscreen)
const showHeader = computed(() => showChrome.value && !route.meta.hideHeader)

const pendingCount = computed(() => shopping.items.filter((item) => !item.checked).length)

// The suggestion button sits in the middle of the tab bar.
const leftTabs = computed(() => tabs.slice(0, 2))
const rightTabs = computed(() => tabs.slice(2))
const suggestOpen = ref(false)

// Tab screens keep their state (search text, scroll) while switching tabs.
const cachedViews = ['HomeView', 'MealsView', 'PlannerView', 'ShoppingView']
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-2xl flex-col">
    <header v-if="showHeader" class="glass sticky top-0 z-20 flex items-center gap-2 bg-white/40 px-5 pb-3 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <RouterLink
        v-if="route.meta.backTo"
        :to="route.meta.backTo"
        class="glass -ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
        :aria-label="t('nav.back')"
      >
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <h1 class="text-2xl font-semibold tracking-tight">{{ route.meta.title ? t(route.meta.title) : '' }}</h1>
    </header>

    <!-- Profile and settings button: fixed, so it stays put while a tab screen scrolls. -->
    <div
      v-if="showChrome && route.meta.tab"
      class="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto flex max-w-2xl justify-end px-5 pt-[max(env(safe-area-inset-top),1.25rem)]"
    >
      <RouterLink
        :to="{ name: 'settings' }"
        class="glass pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card"
        :aria-label="t('nav.profile')"
      >
        <Icon :icon="ICONS.accountCircle" class="text-3xl text-gray-700" />
      </RouterLink>
    </div>

    <main class="flex-1" :class="showChrome ? (showHeader ? 'px-5 pb-32 pt-2' : 'px-5 pb-32') : ''">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="cachedViews">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <nav v-if="showChrome" class="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
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

    <QuickSuggestSheet v-model="suggestOpen" />
    <ToastHost />
  </div>
</template>
