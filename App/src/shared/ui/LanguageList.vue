<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { flagSrc, lang, languages } from '../i18n'
import { ICONS } from '../icons'
</script>

<template>
  <ul class="space-y-3" role="radiogroup" aria-label="Language">
    <li v-for="option in languages" :key="option.id">
      <button
        type="button"
        role="radio"
        class="flex w-full items-center gap-4 rounded-3xl px-4 py-3.5 text-left shadow-card transition active:scale-[0.99]"
        :class="lang === option.id ? 'bg-brand-soft ring-2 ring-brand' : 'bg-card'"
        :aria-checked="lang === option.id"
        @click="lang = option.id"
      >
        <img :src="flagSrc(option.id)" alt="" class="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white" />
        <span class="min-w-0 flex-1 text-base font-semibold">{{ option.label }}</span>
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition"
          :class="lang === option.id ? 'border-brand bg-brand text-white' : 'border-gray-300'"
          aria-hidden="true"
        >
          <Icon v-if="lang === option.id" :icon="ICONS.check" class="text-sm" />
        </span>
      </button>
    </li>
  </ul>
</template>
