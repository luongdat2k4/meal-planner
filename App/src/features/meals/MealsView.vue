<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { DAY_NAMES, usePlanner } from '../planner'
import { MEALS } from './meals'
import type { Meal } from './types'

const { addMealToDay } = usePlanner()

const query = ref('')
const selected = ref<Meal | null>(null)
const addedTo = ref<number | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? MEALS.filter((m) => m.title.toLowerCase().includes(q)) : MEALS
})

function addToDay(day: number) {
  if (!selected.value) return
  addMealToDay(day, selected.value.id)
  addedTo.value = day
  setTimeout(() => {
    addedTo.value = null
    selected.value = null
  }, 600)
}
</script>

<template>
  <section class="space-y-4">
    <div class="relative">
      <Icon :icon="ICONS.magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
      <input
        v-model="query"
        type="search"
        placeholder="Tìm món ăn..."
        class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-brand"
      />
    </div>

    <p class="text-sm text-gray-500">{{ filtered.length }} món</p>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        v-for="meal in filtered"
        :key="meal.id"
        type="button"
        class="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        @click="selected = meal"
      >
        <img
          :src="assetUrl(meal.image)"
          :alt="meal.title"
          loading="lazy"
          class="aspect-square w-full object-cover"
        />
        <span class="block p-2.5 text-sm font-medium leading-snug">{{ meal.title }}</span>
      </button>
    </div>

    <p v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Không tìm thấy món phù hợp.</p>

    <!-- Meal detail sheet -->
    <div
      v-if="selected"
      class="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      @click.self="selected = null"
    >
      <div class="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div class="mb-3 flex items-start justify-between gap-3">
          <h2 class="text-lg font-semibold leading-snug">{{ selected.title }}</h2>
          <button type="button" class="rounded-full p-1 text-gray-500 hover:bg-gray-100" @click="selected = null">
            <Icon :icon="ICONS.close" class="text-2xl" />
          </button>
        </div>

        <img :src="assetUrl(selected.image)" :alt="selected.title" class="mb-4 w-full rounded-2xl object-cover" />

        <p class="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Dữ liệu công thức và nguyên liệu chi tiết chưa được trích xuất từ app gốc.
        </p>

        <h3 class="mb-2 text-sm font-semibold text-gray-700">Thêm vào kế hoạch</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(day, index) in DAY_NAMES"
            :key="day"
            type="button"
            class="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:border-brand hover:bg-brand-soft"
            :class="addedTo === index ? 'border-brand bg-brand-soft text-brand' : ''"
            @click="addToDay(index)"
          >
            <Icon v-if="addedTo === index" :icon="ICONS.check" class="inline" /> {{ day }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
