<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import MealsView from './views/MealsView.vue'
import PlannerView from './views/PlannerView.vue'
import IngredientsView from './views/IngredientsView.vue'
import ShoppingView from './views/ShoppingView.vue'
import SettingsView from './views/SettingsView.vue'
import { ICONS } from './icons'

type TabId = 'meals' | 'planner' | 'ingredients' | 'shopping' | 'settings'

const tabs: { id: TabId; label: string; icon: typeof ICONS.silverware; title: string }[] = [
  { id: 'meals', label: 'Món ăn', icon: ICONS.silverware, title: 'Món ăn' },
  { id: 'planner', label: 'Lịch', icon: ICONS.calendarWeek, title: 'Kế hoạch tuần' },
  { id: 'ingredients', label: 'Nguyên liệu', icon: ICONS.carrot, title: 'Nguyên liệu' },
  { id: 'shopping', label: 'Đi chợ', icon: ICONS.cart, title: 'Danh sách đi chợ' },
  { id: 'settings', label: 'Cài đặt', icon: ICONS.cog, title: 'Cài đặt' },
]

const current = ref<TabId>('meals')
const views = { meals: MealsView, planner: PlannerView, ingredients: IngredientsView, shopping: ShoppingView, settings: SettingsView }
const activeView = computed(() => views[current.value])
const activeTitle = computed(() => tabs.find((t) => t.id === current.value)?.title ?? '')
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#f6f7f5]">
    <header class="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      <h1 class="text-xl font-semibold">{{ activeTitle }}</h1>
    </header>

    <main class="flex-1 px-4 py-4 pb-28">
      <KeepAlive>
        <component :is="activeView" :key="current" />
      </KeepAlive>
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul class="grid grid-cols-5">
        <li v-for="tab in tabs" :key="tab.id">
          <button
            type="button"
            class="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
            :class="current === tab.id ? 'text-brand' : 'text-gray-500'"
            @click="current = tab.id"
          >
            <Icon :icon="tab.icon" class="text-2xl" />
            {{ tab.label }}
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
