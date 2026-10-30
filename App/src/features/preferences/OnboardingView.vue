<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const { state, completeOnboarding } = usePreferences()

const steps = [
  { key: 'welcome', title: 'Chào mừng bạn đến với Mise', subtitle: 'Trả lời vài câu hỏi để nhận kế hoạch bữa ăn hợp với bạn.' },
  { key: 'household', title: 'Bạn nấu cho mấy người?', subtitle: 'Dùng để tính khẩu phần và chi phí.' },
  { key: 'diet', title: 'Chế độ ăn và dị ứng', subtitle: 'Món không phù hợp sẽ không được gợi ý.' },
  { key: 'taste', title: 'Khẩu vị của bạn', subtitle: 'Chọn đạm yêu thích và thời gian nấu tối đa.' },
  { key: 'schedule', title: 'Lịch nấu và ngân sách', subtitle: 'Chọn những ngày bạn muốn nấu trong tuần.' },
  { key: 'reminder', title: 'Nhắc lập kế hoạch', subtitle: 'Nhận lời nhắc mỗi tuần để không bỏ lỡ.' },
] as const

const benefits = [
  { icon: ICONS.autoFix, text: 'Gợi ý món hợp khẩu vị và ngân sách' },
  { icon: ICONS.cart, text: 'Danh sách đi chợ gom sẵn nguyên liệu' },
  { icon: ICONS.bellOutline, text: 'Nhắc bạn lên kế hoạch mỗi tuần' },
]

const step = ref(Math.min(state.onboardingStep, steps.length - 1))
const generating = ref(false)

watch(step, (value) => {
  state.onboardingStep = value
})

const current = computed(() => steps[step.value])
const isLast = computed(() => step.value === steps.length - 1)
const canContinue = computed(() => current.value.key !== 'schedule' || state.cookingDays.length > 0)

async function next() {
  if (!isLast.value) {
    step.value++
    return
  }
  generating.value = true
  // Short pause so the plan "generation" feels intentional.
  await new Promise((resolve) => setTimeout(resolve, 1100))
  regeneratePlan()
  completeOnboarding()
  showToast('Kế hoạch tuần của bạn đã sẵn sàng')
  await router.replace({ name: 'planner' })
}

function skip() {
  completeOnboarding()
  router.replace({ name: 'meals' })
}
</script>

<template>
  <section class="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="flex items-center gap-3">
      <button
        v-if="step > 0"
        type="button"
        class="-ml-1 rounded-full p-1 text-gray-600 hover:bg-gray-200"
        aria-label="Quay lại"
        @click="step--"
      >
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </button>
      <div class="flex flex-1 gap-1.5" role="progressbar" :aria-valuenow="step + 1" :aria-valuemax="steps.length">
        <span v-for="(item, index) in steps" :key="item.key" class="h-1.5 flex-1 rounded-full" :class="index <= step ? 'bg-brand' : 'bg-gray-200'" />
      </div>
      <button type="button" class="text-sm font-medium text-gray-500" @click="skip">Bỏ qua</button>
    </header>

    <main class="flex-1 py-8">
      <div v-if="current.key === 'welcome'" class="flex flex-col items-center pt-6 text-center">
        <div class="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30">
          <Icon :icon="ICONS.silverware" class="text-7xl" />
        </div>
        <h1 class="mb-2 text-3xl font-bold leading-tight">{{ current.title }}</h1>
        <p class="mb-8 text-gray-500">{{ current.subtitle }}</p>
        <ul class="w-full space-y-3 text-left">
          <li v-for="benefit in benefits" :key="benefit.text" class="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon :icon="benefit.icon" class="text-2xl" />
            </span>
            <span class="font-medium">{{ benefit.text }}</span>
          </li>
        </ul>
      </div>

      <template v-else>
        <h1 class="mb-1 text-2xl font-bold leading-tight">{{ current.title }}</h1>
        <p class="mb-6 text-gray-500">{{ current.subtitle }}</p>
        <FieldHousehold v-if="current.key === 'household'" />
        <FieldDiet v-else-if="current.key === 'diet'" />
        <FieldTaste v-else-if="current.key === 'taste'" />
        <FieldSchedule v-else-if="current.key === 'schedule'" />
        <FieldReminder v-else-if="current.key === 'reminder'" />
      </template>
    </main>

    <button
      type="button"
      class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:opacity-40"
      :disabled="!canContinue || generating"
      @click="next"
    >
      {{ isLast ? 'Tạo kế hoạch của tôi' : 'Tiếp tục' }}
    </button>

    <div v-if="generating" class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      <p class="font-semibold">Đang tạo kế hoạch cho bạn...</p>
    </div>
  </section>
</template>
