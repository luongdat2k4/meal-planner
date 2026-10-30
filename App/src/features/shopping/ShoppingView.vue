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
    <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <button type="button" class="flex w-full items-center justify-between" @click="pickingStore = !pickingStore">
        <span class="flex items-center gap-3">
          <img v-if="currentStore" :src="assetUrl(currentStore.logo)" :alt="currentStore.name" class="h-8 w-8 object-contain" />
          <Icon v-else :icon="ICONS.storefront" class="text-2xl text-gray-400" />
          <span class="text-left">
            <span class="block text-xs text-gray-500">Siêu thị</span>
            <span class="font-medium">{{ currentStore?.name ?? 'Chưa chọn' }}</span>
          </span>
        </span>
        <Icon :icon="ICONS.chevronDown" class="text-xl text-gray-400" />
      </button>

      <div v-if="pickingStore" class="mt-4 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
        <button
          type="button"
          class="flex flex-col items-center rounded-xl p-2 text-xs text-gray-600 hover:bg-gray-50"
          @click="pickStore(null)"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">✕</span>
          Bỏ chọn
        </button>
        <button
          v-for="store in STORES"
          :key="store.id"
          type="button"
          class="flex flex-col items-center rounded-xl p-2 text-center text-[11px] leading-tight"
          :class="state.storeId === store.id ? 'bg-brand-soft ring-1 ring-brand' : 'hover:bg-gray-50'"
          @click="pickStore(store.id)"
        >
          <img :src="assetUrl(store.logo)" :alt="store.name" loading="lazy" class="mb-1 h-10 w-10 object-contain" />
          {{ store.name }}
        </button>
      </div>
    </div>

    <!-- Add item -->
    <form class="flex gap-2" @submit.prevent="submit">
      <input
        v-model="newItem"
        type="text"
        placeholder="Thêm món cần mua..."
        class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-brand"
      />
      <button type="submit" class="flex items-center gap-1 rounded-xl bg-brand px-4 font-medium text-white disabled:opacity-40" :disabled="!newItem.trim()">
        <Icon :icon="ICONS.plus" /> Thêm
      </button>
    </form>

    <!-- List -->
    <div class="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm text-gray-500">
        <span>{{ state.items.length }} món · đã mua {{ checkedCount }}</span>
        <button v-if="checkedCount" type="button" class="font-medium text-brand" @click="clearCheckedItems">Xóa đã mua</button>
      </div>

      <ul v-if="state.items.length" class="divide-y divide-gray-100">
        <li v-for="item in state.items" :key="item.id" class="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
            :class="item.checked ? 'border-brand bg-brand text-white' : 'border-gray-300'"
            :aria-label="item.checked ? 'Bỏ đánh dấu' : 'Đánh dấu đã mua'"
            @click="toggleShoppingItem(item.id)"
          >
            <Icon v-if="item.checked" :icon="ICONS.check" />
          </button>
          <span class="min-w-0 flex-1 truncate" :class="item.checked ? 'text-gray-400 line-through' : ''">{{ item.label }}</span>
          <button type="button" class="text-gray-400 hover:text-red-600" aria-label="Xóa" @click="removeShoppingItem(item.id)">
            <Icon :icon="ICONS.trash" class="text-lg" />
          </button>
        </li>
      </ul>
      <p v-else class="px-4 py-10 text-center text-gray-500">
        <Icon :icon="ICONS.cart" class="mx-auto mb-2 text-4xl text-gray-300" />
        Danh sách đi chợ đang trống.
      </p>
    </div>
  </section>
</template>
