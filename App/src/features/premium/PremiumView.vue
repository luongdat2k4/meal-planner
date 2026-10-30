<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink, useRouter } from 'vue-router'
import { CANCEL_REASONS, PLAN_OPTIONS, PREMIUM_BENEFITS, TRIAL_DAYS, type PlanId } from '../../mock-data/plans'
import { formatVnd } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import { t } from '../../shared/i18n'
import { showToast } from '../../shared/toast'
import BottomSheet from '../../shared/ui/BottomSheet.vue'
import { usePremium } from './usePremium'

const router = useRouter()
const { state, isPremium, trialDaysLeft, startTrial, cancel } = usePremium()

const selected = ref<PlanId>('family')
const manageOpen = ref(false)
const reason = ref('')

const currentPlan = computed(() => PLAN_OPTIONS.find((plan) => plan.id === state.plan) ?? null)

async function start() {
  startTrial(selected.value)
  showToast(t('premium.toast.trialStarted', { days: TRIAL_DAYS }))
  await router.replace({ name: 'settings' })
}

function restore() {
  showToast(isPremium.value ? t('premium.toast.restored') : t('premium.toast.nothingToRestore'))
}

function confirmCancel() {
  cancel()
  manageOpen.value = false
  reason.value = ''
  showToast(t('premium.toast.cancelled'))
}
</script>

<template>
  <section class="min-h-dvh pb-48">
    <div class="rounded-b-[40px] bg-gradient-to-br from-brand to-violet-400 px-5 pb-16 pt-[max(env(safe-area-inset-top),1rem)] text-white">
      <RouterLink :to="{ name: 'settings' }" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20" :aria-label="t('ui.close')">
        <Icon :icon="ICONS.close" class="text-2xl" />
      </RouterLink>
      <div class="mt-4 flex flex-col items-center text-center">
        <span class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
          <Icon :icon="ICONS.crown" class="text-5xl" />
        </span>
        <h1 class="text-3xl font-bold">Mise Premium</h1>
        <p class="mt-1 text-white/90">{{ t('premium.tagline') }}</p>
      </div>
    </div>

    <div class="-mt-10 space-y-4 px-5">
      <ul class="space-y-3 rounded-3xl bg-card p-5 shadow-card">
        <li v-for="benefit in PREMIUM_BENEFITS" :key="benefit" class="flex items-start gap-3 text-sm font-medium">
          <Icon :icon="ICONS.checkCircle" class="mt-0.5 shrink-0 text-xl text-brand" />
          {{ t(benefit) }}
        </li>
      </ul>

      <!-- Active subscription -->
      <div v-if="isPremium && currentPlan" class="space-y-3 rounded-3xl bg-card p-5 shadow-card">
        <p class="text-sm text-gray-500">{{ t('premium.currentPlan') }}</p>
        <p class="text-xl font-bold">{{ currentPlan.name }}</p>
        <p class="text-sm text-gray-600">
          {{ trialDaysLeft > 0 ? t('premium.trialLeft', { days: trialDaysLeft }) : t('premium.trialEnded') }}
        </p>
        <div class="flex gap-2">
          <button type="button" class="flex-1 rounded-full bg-brand-soft py-3 text-sm font-semibold text-brand" @click="manageOpen = true">{{ t('premium.manage') }}</button>
          <button type="button" class="flex-1 rounded-full bg-card py-3 text-sm font-semibold text-gray-700 shadow-card" @click="restore">{{ t('premium.restore') }}</button>
        </div>
      </div>

      <!-- Plan picker -->
      <div v-else class="space-y-3" role="radiogroup" :aria-label="t('premium.choosePlan')">
        <button
          v-for="plan in PLAN_OPTIONS"
          :key="plan.id"
          type="button"
          role="radio"
          :aria-checked="selected === plan.id"
          class="relative w-full rounded-3xl bg-card p-5 text-left shadow-card transition"
          :class="selected === plan.id ? 'ring-2 ring-brand' : ''"
          @click="selected = plan.id"
        >
          <span v-if="plan.badge" class="absolute -top-2 right-5 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">{{ plan.badge }}</span>
          <span class="flex items-center justify-between">
            <span class="text-lg font-bold">{{ plan.name }}</span>
            <span class="font-bold text-brand">{{ formatVnd(plan.price) }}<span class="text-xs font-medium text-gray-500">{{ t('premium.perMonth') }}</span></span>
          </span>
          <span class="mt-1 block text-xs text-gray-500">{{ t('premium.maxUsers', { count: plan.members }) }}</span>
          <ul class="mt-3 space-y-1">
            <li v-for="perk in plan.perks" :key="perk" class="flex items-center gap-2 text-sm text-gray-600">
              <Icon :icon="ICONS.check" class="text-brand" /> {{ perk }}
            </li>
          </ul>
        </button>
      </div>
    </div>

    <div
      v-if="!isPremium"
      class="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl bg-gradient-to-t from-[#e4ecff] via-[#e4ecff]/80 to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-8"
    >
      <button
        type="button"
        class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
        @click="start"
      >
        {{ t('premium.startTrial', { days: TRIAL_DAYS }) }}
      </button>
      <div class="mt-2 flex items-center justify-between px-2 text-xs text-gray-500">
        <span>{{ t('premium.demoNotice') }}</span>
        <button type="button" class="font-medium text-gray-600 underline" @click="restore">{{ t('premium.restorePurchase') }}</button>
      </div>
    </div>

    <BottomSheet v-model="manageOpen" :title="t('premium.manage')">
      <p class="mb-3 text-sm text-gray-600">{{ t('premium.cancelPrompt') }}</p>
      <ul class="mb-4 space-y-2">
        <li v-for="item in CANCEL_REASONS" :key="item">
          <button
            type="button"
            class="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium"
            :class="reason === item ? 'bg-brand-soft ring-2 ring-brand' : 'bg-card shadow-card'"
            @click="reason = item"
          >
            {{ t(item) }}
          </button>
        </li>
      </ul>
      <button type="button" class="w-full rounded-full bg-red-600 py-3.5 font-semibold text-white" @click="confirmCancel">{{ t('premium.cancelPlan') }}</button>
    </BottomSheet>
  </section>
</template>
