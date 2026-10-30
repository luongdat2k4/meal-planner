<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { INGREDIENTS } from '../ingredients'
import { MEALS } from '../meals'
import { usePlanner } from '../planner'
import { STORES, useShopping } from '../shopping'
import { DIETARY } from './dietary'

const planner = usePlanner()
const shopping = useShopping()

function confirmReset() {
  if (!window.confirm('Xóa toàn bộ kế hoạch và danh sách đi chợ trên thiết bị này?')) return
  planner.reset()
  shopping.reset()
}
</script>

<template>
  <section class="space-y-4">
    <!-- Premium (not connected) -->
    <div class="rounded-2xl bg-gradient-to-br from-brand to-emerald-700 p-5 text-white shadow-sm">
      <div class="mb-2 flex items-center gap-2 font-semibold">
        <Icon :icon="ICONS.crown" class="text-xl" /> Premium
      </div>
      <p class="text-sm text-white/85">Mở khóa đầy đủ tính năng. Thanh toán chưa được kết nối trong bản này.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p class="text-2xl font-semibold text-brand">{{ MEALS.length }}</p>
        <p class="text-xs text-gray-500">Món ăn</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p class="text-2xl font-semibold text-brand">{{ INGREDIENTS.length }}</p>
        <p class="text-xs text-gray-500">Nguyên liệu</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p class="text-2xl font-semibold text-brand">{{ STORES.length }}</p>
        <p class="text-xs text-gray-500">Siêu thị</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p class="text-2xl font-semibold text-brand">{{ planner.plannedMealCount }}</p>
        <p class="text-xs text-gray-500">Món đã lên lịch</p>
      </div>
    </div>

    <!-- Dietary -->
    <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <h2 class="mb-3 flex items-center gap-2 font-semibold">
        <Icon :icon="ICONS.carrot" class="text-brand" /> Chế độ ăn
      </h2>
      <ul class="grid grid-cols-2 gap-2">
        <li v-for="diet in DIETARY" :key="diet.id" class="flex items-center gap-2 rounded-xl bg-gray-50 p-2 text-sm">
          <img :src="assetUrl(diet.icon)" :alt="diet.name" class="h-8 w-8 object-contain" />
          {{ diet.name }}
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-red-600 shadow-sm ring-1 ring-black/5"
      @click="confirmReset"
    >
      Xóa dữ liệu trên thiết bị
    </button>
  </section>
</template>
