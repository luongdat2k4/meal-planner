<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import { regeneratePlan } from '../planner'
import FieldDiet from './components/FieldDiet.vue'
import FieldHousehold from './components/FieldHousehold.vue'
import FieldReminder from './components/FieldReminder.vue'
import FieldSchedule from './components/FieldSchedule.vue'
import FieldTaste from './components/FieldTaste.vue'
import { usePreferences } from './usePreferences'

const router = useRouter()
const { state } = usePreferences()

const generating = ref(false)

async function regenerate() {
  generating.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  regeneratePlan()
  generating.value = false
  showToast('Đã tạo lại kế hoạch theo sở thích mới')
  await router.push({ name: 'planner' })
}
</script>

<template>
  <section class="space-y-4">
    <p class="text-sm text-gray-500">Thay đổi được lưu tự động. Tạo lại kế hoạch để áp dụng sở thích mới.</p>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-3 font-bold">Số người ăn</h2>
      <FieldHousehold />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">Ăn uống</h2>
      <FieldDiet />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">Khẩu vị</h2>
      <FieldTaste />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">Lịch nấu và ngân sách</h2>
      <FieldSchedule />
    </article>

    <article class="rounded-3xl bg-card p-5 shadow-card">
      <h2 class="mb-4 font-bold">Nhắc nhở</h2>
      <FieldReminder />
    </article>

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:opacity-40"
      :disabled="generating || !state.cookingDays.length"
      @click="regenerate"
    >
      <Icon :icon="ICONS.autoFix" class="text-xl" />
      {{ generating ? 'Đang tạo...' : 'Lưu và tạo lại kế hoạch' }}
    </button>
  </section>
</template>
