<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { flagSrc, lang, languages } from '../../shared/i18n'
import { ICONS } from '../../shared/icons'
</script>

<template>
  <section class="space-y-4">
    <ul class="space-y-3">
      <li v-for="option in languages" :key="option.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-3xl bg-card px-4 py-3.5 text-left shadow-card transition active:scale-[0.99]"
          :class="lang === option.id ? 'ring-2 ring-brand' : ''"
          :aria-pressed="lang === option.id"
          @click="lang = option.id"
        >
          <img :src="flagSrc(option.id)" alt="" class="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm" />
          <span class="min-w-0 flex-1 font-semibold">{{ option.label }}</span>
          <Icon v-if="lang === option.id" :icon="ICONS.checkCircle" class="text-2xl text-brand" />
        </button>
      </li>
    </ul>
  </section>
</template>
