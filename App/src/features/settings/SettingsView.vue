<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, useRouter } from 'vue-router'
import { resetAllData } from '../../app/resetAll'
import { PLAN_OPTIONS } from '../../mock-data/plans'
import { formatVnd } from '../../shared/format'
import { lang, languages } from '../../shared/i18n'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import ListRow from '../../shared/ui/ListRow.vue'
import ToggleSwitch from '../../shared/ui/ToggleSwitch.vue'
import { useAccount } from '../account'
import { MAX_MEMBERS, useHousehold } from '../household'
import { getIngredients } from '../ingredients'
import { getMeals } from '../meals'
import { DAY_NAMES, usePlanner } from '../planner'
import { usePreferences } from '../preferences'
import { usePremium } from '../premium'
import { STORES } from '../shopping'

const router = useRouter()
const { state: account } = useAccount()
const { state: household } = useHousehold()
const { state: prefs } = usePreferences()
const { plannedMealCount } = usePlanner()
const { state: premium, isPremium, trialDaysLeft } = usePremium()

const preferenceSummary = computed(
  () => `${prefs.householdSize} người · ${prefs.cookingDays.length} ngày nấu · ${formatVnd(prefs.weeklyBudget)}/tuần`,
)
const reminderSummary = computed(() =>
  prefs.reminder.enabled ? `${DAY_NAMES[prefs.reminder.day]} lúc ${prefs.reminder.time}` : 'Đang tắt',
)
const premiumSummary = computed(() => {
  const plan = PLAN_OPTIONS.find((option) => option.id === premium.plan)
  if (!isPremium.value || !plan) return 'Mở khóa đầy đủ tính năng'
  return `Gói ${plan.name}${trialDaysLeft.value > 0 ? ` · còn ${trialDaysLeft.value} ngày dùng thử` : ''}`
})

const stats = computed(() => [
  { label: 'Món ăn', value: getMeals().length },
  { label: 'Nguyên liệu', value: getIngredients().length },
  { label: 'Siêu thị', value: STORES.length },
  { label: 'Món đã lên lịch', value: plannedMealCount.value },
])

async function confirmReset() {
  if (!window.confirm('Xóa toàn bộ dữ liệu trên thiết bị này (kế hoạch, đi chợ, yêu thích, sở thích, tài khoản)?')) return
  resetAllData()
  showToast('Đã xóa dữ liệu')
  await router.replace({ name: 'onboarding' })
}
</script>

<template>
  <section class="space-y-4">
    <!-- Account -->
    <RouterLink :to="{ name: 'account' }" class="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card transition active:scale-[0.99]">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <span v-if="account.signedIn" class="text-2xl font-bold">{{ account.name.charAt(0) }}</span>
        <Icon v-else :icon="ICONS.accountCircle" class="text-4xl" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-bold">{{ account.signedIn ? account.name : 'Đang dùng ẩn danh' }}</span>
        <span class="block truncate text-sm text-gray-500">{{ account.signedIn ? account.email : 'Đăng nhập để sao lưu dữ liệu' }}</span>
      </span>
      <Icon :icon="ICONS.chevronRight" class="text-xl text-gray-300" />
    </RouterLink>

    <!-- Premium -->
    <RouterLink
      :to="{ name: 'premium' }"
      class="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand to-violet-400 p-4 text-white shadow-lg shadow-brand/30 transition active:scale-[0.99]"
    >
      <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon :icon="ICONS.crown" class="text-3xl" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-lg font-bold">Premium</span>
        <span class="block truncate text-sm text-white/90">{{ premiumSummary }}</span>
      </span>
      <Icon :icon="ICONS.chevronRight" class="text-xl text-white/70" />
    </RouterLink>

    <!-- Planning -->
    <div class="space-y-3">
      <ListRow :icon="ICONS.tuneVariant" title="Sở thích ăn uống" :subtitle="preferenceSummary" :to="{ name: 'preferences' }" />
      <ListRow
        :icon="ICONS.homeGroup"
        title="Gia đình"
        :subtitle="`${household.members.length}/${MAX_MEMBERS} thành viên`"
        :to="{ name: 'household' }"
      />
      <ListRow :icon="ICONS.translate" title="Ngôn ngữ món ăn" subtitle="Tên món, nguyên liệu và cách nấu">
        <select v-model="lang" class="rounded-xl bg-surface px-3 py-1.5 text-sm outline-none" aria-label="Ngôn ngữ món ăn">
          <option v-for="option in languages" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>
      </ListRow>
      <ListRow :icon="ICONS.bellOutline" title="Nhắc lập kế hoạch" :subtitle="reminderSummary">
        <ToggleSwitch v-model="prefs.reminder.enabled" label="Nhắc lập kế hoạch hằng tuần" />
      </ListRow>
    </div>

    <!-- Stats -->
    <ul class="grid grid-cols-2 gap-3">
      <li v-for="stat in stats" :key="stat.label" class="rounded-3xl bg-card p-4 shadow-card">
        <p class="text-2xl font-bold text-brand">{{ stat.value }}</p>
        <p class="text-xs text-gray-500">{{ stat.label }}</p>
      </li>
    </ul>

    <!-- Danger zone -->
    <ListRow
      :icon="ICONS.trash"
      title="Xóa dữ liệu trên thiết bị"
      danger
      class="cursor-pointer"
      role="button"
      tabindex="0"
      @click="confirmReset"
      @keydown.enter="confirmReset"
    />
  </section>
</template>
