<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { STORES } from './stores'
import { useShopping } from './useShopping'

const { state, addShoppingItem, toggleShoppingItem, removeShoppingItem, clearCheckedItems, setStore } = useShopping()

const newItem = ref('')
const pickingStore = ref(false)

const currentStore = computed(() => STORES.find((s) => s.id === state.storeId) ?? null)
const checkedCount = computed(() => state.items.filter((i) => i.checked).length)
const progress = computed(() => (state.items.length ? (checkedCount.value / state.items.length) * 100 : 0))
// Items still to buy first; bought ones sink to the bottom.
const sortedItems = computed(() => [...state.items].sort((a, b) => Number(a.checked) - Number(b.checked)))

function submit() {
  addShoppingItem(newItem.value)
  newItem.value = ''
}

function pickStore(id: string | null) {
  setStore(id)
  pickingStore.value = false
}
</script>

<template>
  <section class="space-y-4">
    <!-- Store -->
    <div class="rounded-3xl bg-white p-4 shadow-card">
      <button type="button" class="flex w-full items-center justify-between" @click="pickingStore = !pickingStore">
        <span class="flex items-center gap-3">
          <img v-if="currentStore" :src="assetUrl(currentStore.logo)" :alt="currentStore.name" class="h-10 w-10 rounded-xl object-contain" />
          <span v-else class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon :icon="ICONS.storefront" class="text-2xl" />
          </span>
          <span class="text-left">
            <span class="block text-xs text-gray-500">Siêu thị</span>
            <span class="font-semibold">{{ currentStore?.name ?? 'Chưa chọn' }}</span>
          </span>
        </span>
        <Icon :icon="ICONS.chevronDown" class="text-xl text-gray-400 transition" :class="pickingStore ? 'rotate-180' : ''" />
      </button>

      <div v-if="pickingStore" class="mt-4 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
        <button
          type="button"
          class="flex flex-col items-center rounded-2xl p-2 text-xs text-gray-600 hover:bg-gray-50"
          @click="pickStore(null)"
        >
          <span class="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Icon :icon="ICONS.close" class="text-lg" />
          </span>
          Bỏ chọn
        </button>
        <button
          v-for="store in STORES"
          :key="store.id"
          type="button"
          class="flex flex-col items-center rounded-2xl p-2 text-center text-[11px] leading-tight"
          :class="state.storeId === store.id ? 'bg-brand-soft ring-1 ring-brand' : 'hover:bg-gray-50'"
          @click="pickStore(store.id)"
        >
          <img :src="assetUrl(store.logo)" :alt="store.name" loading="lazy" class="mb-1 h-10 w-10 object-contain" />
          {{ store.name }}
        </button>
      </div>
    </div>

    <!-- Add item -->
    <form class="flex items-center gap-2 rounded-2xl bg-white p-1.5 pl-4 shadow-card" @submit.prevent="submit">
      <input
        v-model="newItem"
        type="text"
        placeholder="Thêm món cần mua..."
        class="min-w-0 flex-1 bg-transparent py-2 outline-none"
      />
      <button
        type="submit"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-40"
        :disabled="!newItem.trim()"
        aria-label="Thêm"
      >
        <Icon :icon="ICONS.plus" class="text-2xl" />
      </button>
    </form>

    <!-- Progress -->
    <div v-if="state.items.length" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="font-semibold">Đã mua {{ checkedCount }}/{{ state.items.length }}</span>
        <button v-if="checkedCount" type="button" class="font-medium text-brand" @click="clearCheckedItems">Xóa đã mua</button>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-gray-200">
        <div class="h-full rounded-full bg-brand transition-all" :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <!-- List -->
    <ul v-if="state.items.length" class="space-y-2">
      <li v-for="item in sortedItems" :key="item.id" class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
        <button
          type="button"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition"
          :class="item.checked ? 'border-brand bg-brand text-white' : 'border-gray-300'"
          :aria-label="item.checked ? 'Bỏ đánh dấu' : 'Đánh dấu đã mua'"
          @click="toggleShoppingItem(item.id)"
        >
          <Icon v-if="item.checked" :icon="ICONS.check" class="text-sm" />
        </button>
        <span class="min-w-0 flex-1 truncate" :class="item.checked ? 'text-gray-400 line-through' : 'font-medium'">{{ item.label }}</span>
        <button type="button" class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600" aria-label="Xóa" @click="removeShoppingItem(item.id)">
          <Icon :icon="ICONS.trash" class="text-xl" />
        </button>
      </li>
    </ul>
    <div v-else class="rounded-3xl bg-white px-6 py-10 text-center shadow-card">
      <Icon :icon="ICONS.cart" class="mx-auto mb-3 text-5xl text-gray-300" />
      <p class="text-gray-500">Danh sách đi chợ đang trống.</p>
    </div>
  </section>
</template>
