<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useShopping } from '../features/shopping'
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

const pendingCount = computed(() => shopping.items.filter((item) => !item.checked).length)

// Tab screens keep their state (search text, scroll) while switching tabs.
const cachedViews = ['MealsView', 'PlannerView', 'IngredientsView', 'ShoppingView', 'SettingsView']
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-2xl flex-col">
    <header v-if="showChrome" class="flex items-center gap-2 px-5 pb-2 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <RouterLink v-if="route.meta.backTo" :to="route.meta.backTo" class="-ml-2 rounded-full p-1.5 text-gray-700 hover:bg-gray-200" aria-label="Quay lại">
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <h1 class="text-2xl font-bold tracking-tight">{{ route.meta.title }}</h1>
    </header>

    <main class="flex-1" :class="showChrome ? 'px-5 pb-32 pt-2' : ''">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="cachedViews">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <nav
      v-if="showChrome"
      class="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <ul class="grid grid-cols-5 items-end rounded-[28px] bg-white px-2 shadow-[0_10px_30px_rgb(0_0_0/0.12)]">
        <li v-for="tab in tabs" :key="tab.name">
          <RouterLink :to="{ name: tab.name }" custom v-slot="{ href, navigate, isActive }">
            <a
              v-if="tab.center"
              :href="href"
              :aria-label="tab.label"
              :aria-current="isActive ? 'page' : undefined"
              class="relative mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 ring-4 ring-surface transition active:scale-95"
              :class="isActive ? 'bg-brand-dark' : ''"
              @click="navigate"
            >
              <Icon :icon="tab.icon" class="text-2xl" />
              <span
                v-if="pendingCount"
                class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1 text-[11px] font-semibold"
              >
                {{ pendingCount > 99 ? '99+' : pendingCount }}
              </span>
            </a>
            <a
              v-else
              :href="href"
              :aria-current="isActive ? 'page' : undefined"
              class="flex flex-col items-center gap-0.5 py-3 text-[11px] font-medium transition"
              :class="isActive ? 'text-brand' : 'text-gray-400'"
              @click="navigate"
            >
              <Icon :icon="tab.icon" class="text-2xl" />
              {{ tab.label }}
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <ToastHost />
  </div>
</template>
