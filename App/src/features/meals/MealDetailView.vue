<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { DAY_NAMES, usePlanner } from '../planner'
import { MEALS } from './meals'

const props = defineProps<{ id: string }>()

const { addMealToDay } = usePlanner()

const meal = computed(() => MEALS.find((m) => m.id === props.id) ?? null)
const lastAddedDay = ref<number | null>(null)

function addToDay(day: number) {
  if (!meal.value) return
  addMealToDay(day, meal.value.id)
  lastAddedDay.value = day
}
</script>

<template>
  <section v-if="meal" class="space-y-4">
    <img :src="assetUrl(meal.image)" :alt="meal.title" class="w-full rounded-2xl object-cover" />

    <h2 class="text-lg font-semibold leading-snug">{{ meal.title }}</h2>

    <p class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
      Dữ liệu công thức và nguyên liệu chi tiết chưa được trích xuất từ app gốc.
    </p>

    <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <h3 class="mb-3 text-sm font-semibold text-gray-700">Thêm vào kế hoạch</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="(day, index) in DAY_NAMES"
          :key="day"
          type="button"
          class="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:border-brand hover:bg-brand-soft"
          :class="lastAddedDay === index ? 'border-brand bg-brand-soft text-brand' : ''"
          @click="addToDay(index)"
        >
          <Icon v-if="lastAddedDay === index" :icon="ICONS.check" class="inline" /> {{ day }}
        </button>
      </div>
      <p v-if="lastAddedDay !== null" class="mt-3 text-sm text-gray-600">
        Đã thêm vào {{ DAY_NAMES[lastAddedDay] }}.
        <RouterLink :to="{ name: 'planner' }" class="font-medium text-brand">Xem kế hoạch</RouterLink>
      </p>
    </div>
  </section>

  <section v-else class="py-10 text-center text-gray-500">
    Không tìm thấy món này.
    <RouterLink :to="{ name: 'meals' }" class="font-medium text-brand">Về danh sách món</RouterLink>
  </section>
</template>
