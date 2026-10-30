<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { INGREDIENTS } from '../ingredients'
import { MEALS, useFavorites } from '../meals'
import { usePlanner } from '../planner'
import { STORES, useShopping } from '../shopping'
import { DIETARY } from './dietary'

const planner = usePlanner()
const shopping = useShopping()
const favorites = useFavorites()

function confirmReset() {
  if (!window.confirm('Xóa kế hoạch, danh sách đi chợ và món yêu thích trên thiết bị này?')) return
  planner.reset()
  shopping.reset()
  favorites.reset()
}
</script>

<template>
  <section class="space-y-4">
    <!-- Premium (not connected) -->
    <div class="rounded-3xl bg-gradient-to-br from-brand to-orange-400 p-5 text-white shadow-lg shadow-brand/30">
      <div class="mb-2 flex items-center gap-2 text-lg font-bold">
        <Icon :icon="ICONS.crown" class="text-2xl" /> Premium
      </div>
      <p class="text-sm text-white/90">Mở khóa đầy đủ tính năng. Thanh toán chưa được kết nối trong bản này.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-3xl bg-white p-4 shadow-card">
        <p class="text-2xl font-bold text-brand">{{ MEALS.length }}</p>
        <p class="text-xs text-gray-500">Món ăn</p>
      </div>
      <div class="rounded-3xl bg-white p-4 shadow-card">
        <p class="text-2xl font-bold text-brand">{{ INGREDIENTS.length }}</p>
        <p class="text-xs text-gray-500">Nguyên liệu</p>
      </div>
      <div class="rounded-3xl bg-white p-4 shadow-card">
        <p class="text-2xl font-bold text-brand">{{ STORES.length }}</p>
        <p class="text-xs text-gray-500">Siêu thị</p>
      </div>
      <div class="rounded-3xl bg-white p-4 shadow-card">
        <p class="text-2xl font-bold text-brand">{{ planner.plannedMealCount }}</p>
        <p class="text-xs text-gray-500">Món đã lên lịch</p>
      </div>
    </div>

    <!-- Dietary -->
    <div class="rounded-3xl bg-white p-4 shadow-card">
      <h2 class="mb-3 flex items-center gap-2 font-semibold">
        <Icon :icon="ICONS.carrot" class="text-brand" /> Chế độ ăn
      </h2>
      <ul class="grid grid-cols-2 gap-2">
        <li v-for="diet in DIETARY" :key="diet.id" class="flex items-center gap-2 rounded-2xl bg-surface p-2 text-sm font-medium">
          <img :src="assetUrl(diet.icon)" :alt="diet.name" class="h-8 w-8 object-contain" />
          {{ diet.name }}
        </li>
      </ul>
    </div>

    <!-- Danger zone -->
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-3xl bg-white px-4 py-4 text-left font-medium text-red-600 shadow-card"
      @click="confirmReset"
    >
      <span class="flex items-center gap-3">
        <Icon :icon="ICONS.trash" class="text-xl" /> Xóa dữ liệu trên thiết bị
      </span>
      <Icon :icon="ICONS.chevronRight" class="text-xl text-gray-300" />
    </button>
  </section>
</template>
