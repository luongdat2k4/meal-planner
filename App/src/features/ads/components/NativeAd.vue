<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF, type NativeAdTemplate } from '@alf/app-sdk'
import { adsAvailable, adsSuppressed } from '../adRuntime'
import { NATIVE_HEIGHTS } from '../adsConfig'

// The Google Mobile Ads SDK draws the ad in a native view above the WebView, so this element only reserves the space
// and reports its rect. That view cannot be clipped by the page, so it is shown only while the whole box sits between
// the fixed top and bottom chrome (elements marked data-ad-chrome) and nothing else is open above the page.
const props = withDefaults(defineProps<{ name: string; template?: NativeAdTemplate }>(), { template: 'small' })
const emit = defineEmits<{ failed: [] }>()

const height = computed(() => NATIVE_HEIGHTS[props.template])
const box = ref<HTMLElement | null>(null)
const native = Capacitor.isNativePlatform()
const active = ref(true)
const canShow = computed(() => adsAvailable.value && !adsSuppressed.value && active.value)

let shown = false
let everShown = false
let frame = 0
let unsubscribe: (() => void) | undefined
let resizeObserver: ResizeObserver | undefined
// Calls run one after another so a quick hide/show cannot interleave.
let queue: Promise<void> = Promise.resolve()

function freeArea() {
  let top = 0
  let bottom = window.innerHeight
  for (const el of document.querySelectorAll<HTMLElement>('[data-ad-chrome]')) {
    const r = el.getBoundingClientRect()
    if (r.height === 0) continue
    if (el.dataset.adChrome === 'top') top = Math.max(top, r.bottom)
    else bottom = Math.min(bottom, r.top)
  }
  return { top, bottom }
}

async function sync() {
  const ads = ALF.Instance.Ads
  const el = box.value
  let place: { x: number; y: number; width: number; height: number } | null = null
  if (canShow.value && el) {
    const r = el.getBoundingClientRect()
    const area = freeArea()
    if (r.width > 0 && r.top >= area.top && r.bottom <= area.bottom) {
      place = { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }
    }
  }
  try {
    if (!place) {
      if (shown) {
        shown = false
        await ads.HideAdMobNativeAd(props.name)
      }
    } else if (shown) await ads.UpdateAdMobNativeAdRect(place, props.name)
    else {
      everShown = shown = true
      const ok = await ads.ShowAdMobNativeAd({ slot: props.name, template: props.template, rect: place })
      if (!ok) fail()
    }
  } catch (error) {
    console.warn('[ads] native failed', error)
  }
}

function fail() {
  shown = false
  if (everShown) void ALF.Instance.Ads.DestroyAdMobNativeAd(props.name)
  everShown = false
  emit('failed')
}

// The ad sits above the page and does not scroll with it: track the placeholder.
function track() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    queue = queue.then(sync)
  })
}

watch(canShow, track)

onMounted(() => {
  if (!native) return
  window.addEventListener('scroll', track, { passive: true })
  window.addEventListener('resize', track)
  // Layout shifts (a banner appearing, the list growing) move the box without a scroll.
  resizeObserver = new ResizeObserver(track)
  resizeObserver.observe(document.body)
  if (box.value) resizeObserver.observe(box.value)
  unsubscribe = ALF.Instance.Ads.SetOnNativeAdEventHandler((event) => {
    if (event.slot === props.name && event.type === 'failed') fail()
  })
  track()
})

onActivated(() => {
  active.value = true
})
onDeactivated(() => {
  active.value = false
})

onBeforeUnmount(() => {
  if (!native) return
  window.removeEventListener('scroll', track)
  window.removeEventListener('resize', track)
  resizeObserver?.disconnect()
  unsubscribe?.()
  if (frame) cancelAnimationFrame(frame)
  if (everShown) void queue.then(() => ALF.Instance.Ads.DestroyAdMobNativeAd(props.name))
})
</script>

<template>
  <div v-if="native" ref="box" class="w-full shrink-0 rounded-2xl bg-gray-200/60" :style="{ height: `${height}px` }" aria-hidden="true" />
</template>
