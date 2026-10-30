<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { ICONS } from '../../../shared/icons'
import { t } from '../../../shared/i18n'
import { showToast } from '../../../shared/toast'
import BottomSheet from '../../../shared/ui/BottomSheet.vue'
import { regeneratePlan, swapCandidates } from '../generatePlan'
import { usePlanner } from '../usePlanner'

const open = defineModel<boolean>({ required: true })

const router = useRouter()
const { plannedMealCount } = usePlanner()

// Replacing an existing plan needs a second tap to confirm.
const armed = ref(false)

watch(open, () => {
  armed.value = false
})

async function newPlan() {
  if (plannedMealCount.value > 0 && !armed.value) {
    armed.value = true
    return
  }
  regeneratePlan()
  open.value = false
  showToast(t('planner.quick.weekGenerated'))
  await router.push({ name: 'planner' })
}

async function suggestToday() {
  const meal = swapCandidates('', 1)[0]
  if (!meal) {
    showToast(t('planner.quick.noSuggestion'))
    return
  }
  open.value = false
  await router.push({ name: 'meal-detail', params: { id: meal.id } })
}

async function openPreferences() {
  open.value = false
  await router.push({ name: 'preferences' })
}
</script>

<template>
  <BottomSheet v-model="open" :title="t('planner.quick.title')">
    <p class="mb-4 text-sm text-gray-500">{{ t('planner.quick.intro') }}</p>

    <ul class="space-y-3">
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-3xl bg-card p-4 text-left shadow-card transition active:scale-[0.99]"
          :class="armed ? 'ring-2 ring-brand' : ''"
          @click="newPlan"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tile-blue text-brand">
            <Icon :icon="ICONS.autoFix" class="text-2xl" />
          </span>
          <span class="min-w-0">
            <span class="block font-semibold">{{ plannedMealCount ? t('planner.quick.regenerateWeek') : t('planner.quick.generateWeek') }}</span>
            <span class="block text-sm" :class="armed ? 'text-brand' : 'text-gray-500'">
              {{ armed ? t('planner.quick.confirmReplace') : t('planner.quick.pickDays') }}
            </span>
          </span>
        </button>
      </li>
      <li>
        <button type="button" class="flex w-full items-center gap-3 rounded-3xl bg-card p-4 text-left shadow-card transition active:scale-[0.99]" @click="suggestToday">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tile-pink text-rose-500">
            <Icon :icon="ICONS.silverware" class="text-2xl" />
          </span>
          <span>
            <span class="block font-semibold">{{ t('planner.quick.suggestOne') }}</span>
            <span class="block text-sm text-gray-500">{{ t('planner.quick.suggestOneHint') }}</span>
          </span>
        </button>
      </li>
      <li>
        <button type="button" class="flex w-full items-center gap-3 rounded-3xl bg-card p-4 text-left shadow-card transition active:scale-[0.99]" @click="openPreferences">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tile-lilac text-violet-500">
            <Icon :icon="ICONS.tuneVariant" class="text-2xl" />
          </span>
          <span>
            <span class="block font-semibold">{{ t('planner.quick.editPrefs') }}</span>
            <span class="block text-sm text-gray-500">{{ t('planner.quick.editPrefsHint') }}</span>
          </span>
        </button>
      </li>
    </ul>
  </BottomSheet>
</template>
