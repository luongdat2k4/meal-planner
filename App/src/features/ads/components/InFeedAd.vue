<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NativeAdTemplate } from '@alf/app-sdk'
import { t } from '../../../shared/i18n'
import { nativeConfigured } from '../adsConfig'
import { adsPossible } from '../banner'
import NativeAd from './NativeAd.vue'

// A native ad placed in a screen. The "Ad" label sits outside the ad view so the placement stays identifiable even
// before the creative loads; the SDK's own badge and AdChoices stay inside and are never covered. The space is
// reserved up front, so the page does not shift when the ad fills, and a failed load takes label and box away.
// `video` asks for a creative with video (use a template that has a media area: medium or mrec); it starts muted.
// `minViewportHeight` keeps the ad off screens too short to hold it clear of the buttons.
const props = withDefaults(defineProps<{ name: string; template?: NativeAdTemplate; video?: boolean; minViewportHeight?: number }>(), {
  template: 'small',
  video: false,
  minViewportHeight: 0,
})

const viewportHeight = ref(window.innerHeight)
window.addEventListener('resize', () => (viewportHeight.value = window.innerHeight))

// Drawn from the first frame whenever the device can show it and a unit is configured; never taken away because an ad is slow or failed.
const visible = computed(() => adsPossible && nativeConfigured(props.template) && viewportHeight.value >= props.minViewportHeight)
</script>

<template>
  <div v-if="visible" class="w-full">
    <p class="mb-1.5 px-1 text-xs font-medium text-gray-500">{{ t('ads.label') }}</p>
    <NativeAd :name="name" :template="template" :video="video" />
  </div>
</template>
