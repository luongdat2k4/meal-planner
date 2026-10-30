<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { resetAllData } from '../../app/resetAll'
import { formatDateTime } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import BottomSheet from '../../shared/ui/BottomSheet.vue'
import { useAccount, type AccountProvider } from './useAccount'

const router = useRouter()
const { state, signIn, markSynced, signOut } = useAccount()

const syncing = ref(false)
const deleteOpen = ref(false)
const understood = ref(false)

function login(provider: AccountProvider) {
  signIn(provider)
  showToast('Đã đăng nhập (demo)')
}

async function sync() {
  syncing.value = true
  await new Promise((resolve) => setTimeout(resolve, 900))
  markSynced()
  syncing.value = false
  showToast('Đã đồng bộ')
}

function logout() {
  signOut()
  showToast('Đã đăng xuất')
}

async function deleteAccount() {
  resetAllData()
  deleteOpen.value = false
  understood.value = false
  showToast('Đã xóa tài khoản và dữ liệu')
  await router.replace({ name: 'onboarding' })
}
</script>

<template>
  <section class="space-y-4">
    <p class="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
      Bản demo: chưa kết nối đăng nhập thật. Các nút bên dưới chỉ tạo hồ sơ mẫu trên thiết bị này.
    </p>

    <template v-if="!state.signedIn">
      <div class="rounded-3xl bg-white p-6 text-center shadow-card">
        <span class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon :icon="ICONS.cloudSync" class="text-4xl" />
        </span>
        <h2 class="mb-1 text-lg font-bold">Lưu kế hoạch lên đám mây</h2>
        <p class="text-sm text-gray-500">Đăng nhập để sao lưu, khôi phục và dùng trên nhiều thiết bị. Hiện bạn đang dùng ẩn danh, dữ liệu chỉ nằm trên máy này.</p>
      </div>

      <div class="space-y-3">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 font-semibold shadow-card transition active:scale-[0.98]"
          @click="login('google')"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-blue-600">G</span>
          Tiếp tục với Google
        </button>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-3 rounded-full bg-gray-900 py-3.5 font-semibold text-white transition active:scale-[0.98]"
          @click="login('apple')"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold"></span>
          Tiếp tục với Apple
        </button>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">{{ state.name.charAt(0) }}</span>
        <div class="min-w-0 flex-1">
          <p class="font-bold">{{ state.name }}</p>
          <p class="truncate text-sm text-gray-500">{{ state.email }}</p>
          <span class="mt-1 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            {{ state.provider === 'google' ? 'Google' : 'Apple' }}
          </span>
        </div>
      </div>

      <div class="space-y-3 rounded-3xl bg-white p-5 shadow-card">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <Icon :icon="ICONS.shieldCheck" class="text-xl text-emerald-600" />
          Đồng bộ lần cuối: {{ state.lastSyncAt ? formatDateTime(state.lastSyncAt) : 'chưa' }}
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="syncing"
            @click="sync"
          >
            <Icon :icon="ICONS.cloudSync" class="text-lg" :class="syncing ? 'animate-spin' : ''" />
            {{ syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay' }}
          </button>
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-soft py-3 text-sm font-semibold text-brand"
            @click="showToast('Đã khôi phục dữ liệu từ đám mây (demo)')"
          >
            <Icon :icon="ICONS.restore" class="text-lg" /> Khôi phục
          </button>
        </div>
      </div>

      <button type="button" class="flex w-full items-center gap-3 rounded-3xl bg-white px-4 py-4 text-left font-medium shadow-card" @click="logout">
        <Icon :icon="ICONS.logout" class="text-xl text-gray-500" /> Đăng xuất
      </button>
    </template>

    <button
      type="button"
      class="flex w-full items-center gap-3 rounded-3xl bg-white px-4 py-4 text-left font-medium text-red-600 shadow-card"
      @click="deleteOpen = true"
    >
      <Icon :icon="ICONS.trash" class="text-xl" /> Xóa tài khoản và dữ liệu
    </button>

    <BottomSheet v-model="deleteOpen" title="Xóa tài khoản?">
      <p class="mb-4 text-sm text-gray-600">Toàn bộ kế hoạch, danh sách đi chợ, món yêu thích, ghi chú và sở thích sẽ bị xóa khỏi thiết bị này. Không thể hoàn tác.</p>
      <label class="mb-4 flex items-start gap-3 text-sm">
        <input v-model="understood" type="checkbox" class="mt-0.5 h-5 w-5 accent-brand" />
        Tôi hiểu dữ liệu sẽ bị xóa vĩnh viễn.
      </label>
      <button
        type="button"
        class="w-full rounded-full bg-red-600 py-3.5 font-semibold text-white disabled:opacity-40"
        :disabled="!understood"
        @click="deleteAccount"
      >
        Xóa vĩnh viễn
      </button>
    </BottomSheet>
  </section>
</template>
