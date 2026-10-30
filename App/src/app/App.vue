<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ICONS } from '../shared/icons'
import { tabs } from './router'

const route = useRoute()

// Tab screens keep their state (search text, scroll) while switching tabs.
const cachedViews = ['MealsView', 'PlannerView', 'IngredientsView', 'ShoppingView', 'SettingsView']
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#f6f7f5]">
    <header class="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200/70 bg-white/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      <RouterLink v-if="route.meta.backTo" :to="route.meta.backTo" class="-ml-1 rounded-full p-1 text-gray-600 hover:bg-gray-100" aria-label="Quay lại">
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <h1 class="text-xl font-semibold">{{ route.meta.title }}</h1>
    </header>

    <main class="flex-1 px-4 py-4 pb-28">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="cachedViews">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul class="grid grid-cols-5">
        <li v-for="tab in tabs" :key="tab.name">
          <RouterLink :to="{ name: tab.name }" custom v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
              :class="isActive ? 'text-brand' : 'text-gray-500'"
              :aria-current="isActive ? 'page' : undefined"
              @click="navigate"
            >
              <Icon :icon="tab.icon" class="text-2xl" />
              {{ tab.label }}
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
