<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, useRouter } from 'vue-router'
import { resetAllData } from '../../app/resetAll'
import { PLAN_OPTIONS } from '../../mock-data/plans'
import { formatVnd } from '../../shared/format'
import { lang, languages, t } from '../../shared/i18n'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import ListRow from '../../shared/ui/ListRow.vue'
import ToggleSwitch from '../../shared/ui/ToggleSwitch.vue'
import { MAX_MEMBERS, useHousehold } from '../household'
import { getIngredients } from '../ingredients'
import { getMeals } from '../meals'
import { dayNames, usePlanner } from '../planner'
import { usePreferences } from '../preferences'
import { usePremium } from '../premium'
import { STORES } from '../shopping'

const router = useRouter()
const { state: household } = useHousehold()
const { state: prefs } = usePreferences()
const { plannedMealCount } = usePlanner()
const { state: premium, isPremium, trialDaysLeft } = usePremium()

const preferenceSummary = computed(
  () => t('settings.preferenceSummary', { people: prefs.householdSize, days: prefs.cookingDays.length, budget: formatVnd(prefs.weeklyBudget) }),
)
const reminderSummary = computed(() =>
  prefs.reminder.enabled ? t('settings.reminderOn', { day: dayNames()[prefs.reminder.day], time: prefs.reminder.time }) : t('settings.reminderOff'),
)
const premiumSummary = computed(() => {
  const plan = PLAN_OPTIONS.find((option) => option.id === premium.plan)
  if (!isPremium.value || !plan) return t('settings.premiumLocked')
  return t('settings.premiumPlan', { plan: plan.name }) + (trialDaysLeft.value > 0 ? t('settings.trialLeft', { days: trialDaysLeft.value }) : '')
})

const stats = computed(() => [
  { label: t('settings.stats.meals'), value: getMeals().length },
  { label: t('settings.stats.ingredients'), value: getIngredients().length },
  { label: t('settings.stats.stores'), value: STORES.length },
  { label: t('settings.stats.planned'), value: plannedMealCount.value },
])

async function confirmReset() {
  if (!window.confirm(t('settings.resetConfirm'))) return
  resetAllData()
  showToast(t('settings.resetDone'))
  await router.replace({ name: 'onboarding' })
}
</script>

<template>
  <section class="space-y-4">
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
      <ListRow :icon="ICONS.tuneVariant" :title="t('settings.preferences')" :subtitle="preferenceSummary" :to="{ name: 'preferences' }" />
      <ListRow
        :icon="ICONS.homeGroup"
        :title="t('settings.household')"
        :subtitle="t('settings.members', { count: household.members.length, max: MAX_MEMBERS })"
        :to="{ name: 'household' }"
      />
      <ListRow :icon="ICONS.translate" :title="t('settings.language')" :subtitle="t('settings.languageSubtitle')">
        <select v-model="lang" class="rounded-xl bg-surface px-3 py-1.5 text-sm outline-none" :aria-label="t('settings.language')">
          <option v-for="option in languages" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>
      </ListRow>
      <ListRow :icon="ICONS.bellOutline" :title="t('settings.reminder')" :subtitle="reminderSummary">
        <ToggleSwitch v-model="prefs.reminder.enabled" :label="t('settings.reminderToggle')" />
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
      :title="t('settings.reset')"
      danger
      class="cursor-pointer"
      role="button"
      tabindex="0"
      @click="confirmReset"
      @keydown.enter="confirmReset"
    />
  </section>
</template>
