<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF, type NativeAdTemplate } from '@alf/app-sdk'
import { adsAvailable, adsSuppressed } from '../adRuntime'
import { maxUnit, NATIVE_HEIGHTS } from '../adsConfig'
import { hideMrec, moveMrec, showMrec, type Follow } from '../mrec'

// The ad is drawn in a native view above the WebView (an AppLovin MAX MREC for the mrec template while MAX has a unit,
// otherwise the Google Mobile Ads native ad), so this element only reserves the space
// and reports its rect. That view cannot be clipped by the page, so it is shown only while the whole box sits between
// the fixed top and bottom chrome (elements marked data-ad-chrome) and nothing else is open above the page.
const props = withDefaults(defineProps<{ name: string; template?: NativeAdTemplate; video?: boolean }>(), { template: 'small', video: false })
const emit = defineEmits<{ failed: [] }>()

const height = computed(() => NATIVE_HEIGHTS[props.template])
const box = ref<HTMLElement | null>(null)
const native = Capacitor.isNativePlatform()
const active = ref(true)
const canShow = computed(() => adsAvailable.value && !adsSuppressed.value && active.value)

// MAX MREC first for the mrec template; flips to false (AdMob native takes over) if MAX cannot create the view.
let useMax = props.template === 'mrec' && !!maxUnit('mrec')
// Where the page scrolls on a scroll box inside it, Android cannot see that scroll, so the MAX view is hidden while the
// page scrolls and comes back once it has settled. Where the page scrolls on the document, Android moves the view in
// the frame being drawn (see AdFollowPlugin.java) and nothing has to be hidden.
let scrolling = false
let followKey = ''
let settleTimer: ReturnType<typeof setTimeout> | undefined
const SCROLL_SETTLE_MS = 350
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

// True when no scroll box sits between the element and the document, so the document's own scroll moves it.
function scrollsOnDocument(el: HTMLElement) {
  for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY
    if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') return false
  }
  return true
}

async function sync() {
  const ads = ALF.Instance.Ads
  const el = box.value
  let place: { x: number; y: number; width: number; height: number } | null = null
  let follow: Follow | undefined
  if (canShow.value && el) {
    const r = el.getBoundingClientRect()
    const area = freeArea()
    if (useMax && scrollsOnDocument(el)) {
      // Android keeps the view inside the free band by itself, frame by frame.
      if (r.width > 0) {
        place = { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }
        follow = { pageTop: Math.round(r.top + window.scrollY), clipTop: Math.round(area.top), clipBottom: Math.round(area.bottom) }
      }
    } else if (!(useMax && scrolling) && r.width > 0 && r.top >= area.top && r.bottom <= area.bottom) {
      place = { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }
    }
  }
  try {
    if (!place) {
      if (shown) {
        shown = false
        if (useMax) await hideMrec(props.name)
        else await ads.HideAdMobNativeAd(props.name)
      }
    } else if (shown) {
      if (useMax) {
        // Following the page, nothing changes while it scrolls: send only when the ad's place in the page or the band moves.
        const key = follow ? `${place.x},${place.width},${place.height},${follow.pageTop},${follow.clipTop},${follow.clipBottom}` : ''
        if (!follow || key !== followKey) await moveMrec(props.name, place, follow)
        followKey = key
      } else await ads.UpdateAdMobNativeAdRect(place, props.name)
    } else if (useMax && (await showMrec(props.name, place, follow))) {
      followKey = follow ? `${place.x},${place.width},${place.height},${follow.pageTop},${follow.clipTop},${follow.clipBottom}` : ''
      shown = true
    } else {
      useMax = false
      everShown = shown = true
      const ok = await ads.ShowAdMobNativeAd({ slot: props.name, template: props.template, rect: place, ...(props.video && { video: { startMuted: true } }) })
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
function onScroll() {
  if (useMax && box.value && !scrollsOnDocument(box.value)) {
    scrolling = true
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      scrolling = false
      track()
    }, SCROLL_SETTLE_MS)
  }
  track()
}

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
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
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
  document.removeEventListener('scroll', onScroll, { capture: true })
  window.removeEventListener('resize', track)
  resizeObserver?.disconnect()
  unsubscribe?.()
  if (frame) cancelAnimationFrame(frame)
  clearTimeout(settleTimer)
  if (useMax) void queue.then(() => hideMrec(props.name))
  if (everShown) void queue.then(() => ALF.Instance.Ads.DestroyAdMobNativeAd(props.name))
})
</script>

<template>
  <div v-if="native" ref="box" class="w-full shrink-0 rounded-2xl bg-gray-200/60" :style="{ height: `${height}px` }" aria-hidden="true" />
</template>
