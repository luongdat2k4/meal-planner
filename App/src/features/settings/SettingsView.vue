<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { resetAllData } from '../../app/resetAll'
import { formatVnd } from '../../shared/format'
import { flagSrc, lang, languages, t } from '../../shared/i18n'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import ListRow from '../../shared/ui/ListRow.vue'
import ToggleSwitch from '../../shared/ui/ToggleSwitch.vue'
import { getIngredients } from '../ingredients'
import { getMeals } from '../meals'
import { dayNames, usePlanner } from '../planner'
import { usePreferences } from '../preferences'
import { STORES } from '../shopping'

const router = useRouter()
const { state: prefs } = usePreferences()
const { plannedMealCount } = usePlanner()

const preferenceSummary = computed(
  () => t('settings.preferenceSummary', { people: prefs.householdSize, days: prefs.cookingDays.length, budget: formatVnd(prefs.weeklyBudget) }),
)
const reminderSummary = computed(() =>
  prefs.reminder.enabled ? t('settings.reminderOn', { day: dayNames()[prefs.reminder.day], time: prefs.reminder.time }) : t('settings.reminderOff'),
)
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
    <!-- Planning -->
    <div class="space-y-3">
      <ListRow :icon="ICONS.tuneVariant" :title="t('settings.preferences')" :subtitle="preferenceSummary" :to="{ name: 'preferences' }" />
      <ListRow
        :icon="ICONS.translate"
        :title="t('settings.language')"
        :subtitle="languages.find((option) => option.id === lang)?.label"
        :to="{ name: 'settings-language' }"
      >
        <img :src="flagSrc(lang)" alt="" class="h-7 w-7 shrink-0 rounded-full object-cover shadow-sm" />
        <Icon :icon="ICONS.chevronRight" class="text-xl text-gray-300" />
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
