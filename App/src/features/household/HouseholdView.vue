<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import { MAX_MEMBERS, useHousehold } from './useHousehold'

const { state, isFull, isOwner, addDemoMember, removeMember, renewInviteCode, joinWithCode, leave } = useHousehold()

const joinCode = ref('')
const joinError = ref('')

const avatarColors = [
  'bg-orange-100 text-orange-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
]

async function copyCode() {
  try {
    await navigator.clipboard.writeText(state.inviteCode)
    showToast('Đã sao chép mã mời')
  } catch {
    showToast('Không thể sao chép trên thiết bị này')
  }
}

async function share() {
  const text = `Tham gia hộ gia đình của mình trên Mise bằng mã ${state.inviteCode}`
  try {
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      showToast('Đã sao chép lời mời')
    }
  } catch {
    // The user dismissed the share sheet.
  }
}

function join() {
  if (joinWithCode(joinCode.value)) {
    joinCode.value = ''
    joinError.value = ''
    showToast('Đã tham gia hộ gia đình (demo)')
  } else {
    joinError.value = 'Mã không hợp lệ. Mã có dạng MISE-XXXXXX.'
  }
}

function confirmLeave() {
  if (window.confirm('Rời khỏi hộ gia đình này?')) {
    leave()
    showToast('Đã rời hộ gia đình')
  }
}
</script>

<template>
  <section class="space-y-4">
    <p class="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
      Bản demo: thành viên và lời mời chỉ là dữ liệu mẫu trên thiết bị này, chưa chia sẻ thật.
    </p>

    <!-- Members -->
    <div class="rounded-3xl bg-white p-5 shadow-card">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 font-bold"><Icon :icon="ICONS.homeGroup" class="text-xl text-brand" /> Thành viên</h2>
        <span class="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{{ state.members.length }}/{{ MAX_MEMBERS }}</span>
      </div>

      <ul class="space-y-3">
        <li v-for="(member, index) in state.members" :key="member.id" class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-full font-bold" :class="avatarColors[index % avatarColors.length]">
            {{ member.name.charAt(0) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold">{{ member.name }}</span>
            <span class="text-xs text-gray-500">{{ member.role === 'owner' ? 'Chủ hộ' : 'Thành viên' }}</span>
          </span>
          <button
            v-if="isOwner && member.id !== 'me'"
            type="button"
            class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
            :aria-label="`Xóa ${member.name} khỏi hộ gia đình`"
            @click="removeMember(member.id)"
          >
            <Icon :icon="ICONS.close" class="text-xl" />
          </button>
        </li>
      </ul>

      <p class="mt-4 text-xs text-gray-500">Mọi thành viên dùng chung kế hoạch tuần và danh sách đi chợ.</p>
    </div>

    <!-- Invite -->
    <div v-if="isOwner" class="space-y-4 rounded-3xl bg-white p-5 shadow-card">
      <h2 class="flex items-center gap-2 font-bold"><Icon :icon="ICONS.accountPlus" class="text-xl text-brand" /> Mời người thân</h2>

      <p v-if="isFull" class="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
        Gói gia đình đã đầy ({{ MAX_MEMBERS }}/{{ MAX_MEMBERS }} thành viên). Hãy xóa bớt một người để mời thêm.
      </p>

      <div class="rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft py-4 text-center">
        <p class="text-xs text-gray-500">Mã mời của bạn</p>
        <p class="text-2xl font-bold tracking-widest text-brand">{{ state.inviteCode }}</p>
      </div>

      <div class="flex gap-2">
        <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white disabled:opacity-40" :disabled="isFull" @click="copyCode">
          <Icon :icon="ICONS.contentCopy" class="text-lg" /> Sao chép
        </button>
        <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-soft py-3 text-sm font-semibold text-brand disabled:opacity-40" :disabled="isFull" @click="share">
          <Icon :icon="ICONS.shareVariant" class="text-lg" /> Chia sẻ
        </button>
      </div>

      <div class="flex justify-between text-sm">
        <button type="button" class="font-medium text-gray-500" @click="renewInviteCode">Tạo mã mới</button>
        <button type="button" class="font-medium text-gray-500 disabled:opacity-40" :disabled="isFull" @click="addDemoMember">
          Thêm thành viên mẫu (demo)
        </button>
      </div>
    </div>

    <!-- Join -->
    <form v-if="isOwner && state.members.length === 1" class="space-y-3 rounded-3xl bg-white p-5 shadow-card" @submit.prevent="join">
      <h2 class="font-bold">Có mã mời?</h2>
      <div class="flex gap-2">
        <input
          v-model="joinCode"
          type="text"
          placeholder="MISE-XXXXXX"
          autocapitalize="characters"
          class="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3 uppercase tracking-wider outline-none ring-1 ring-transparent focus:ring-brand/40"
        />
        <button type="submit" class="rounded-2xl bg-brand px-5 font-semibold text-white disabled:opacity-40" :disabled="!joinCode.trim()">Tham gia</button>
      </div>
      <p v-if="joinError" class="text-sm text-red-600">{{ joinError }}</p>
    </form>

    <button
      v-if="!isOwner || state.members.length > 1"
      type="button"
      class="w-full rounded-3xl bg-white px-4 py-4 text-left font-medium text-red-600 shadow-card"
      @click="confirmLeave"
    >
      {{ isOwner ? 'Giải tán hộ gia đình' : 'Rời hộ gia đình' }}
    </button>
  </section>
</template>
