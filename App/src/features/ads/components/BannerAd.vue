<script lang="ts">
let owner: symbol | null = null
let operation = Promise.resolve()
function enqueue(action: () => Promise<void>) {
  operation = operation.then(action).catch((error) => console.warn('[ads] banner failed', error))
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF } from '@alf/app-sdk'
import { BANNER_GAP } from '../adsConfig'

// The SDK draws the banner over the WebView, anchored to the bottom edge of the screen, so this component draws
// nothing itself. It creates the banner the first time it is asked to show and from then on only hides and shows it:
// destroying and re-creating a banner restarts the ad network's load (and its wait) every time, so the banner is
// destroyed only when the component goes away for good. The strip is reserved by raising --ad-bottom, which the tab
// bar and the page padding follow. A fixed 320x50 banner keeps the height the page reserves known.
const props = defineProps<{ visible: boolean }>()
const native = Capacitor.isNativePlatform()
const id = Symbol('banner-host')
let created = false

function reserve(px: number) {
  document.documentElement.style.setProperty('--ad-bottom', `${px}px`)
}

async function apply(visible: boolean) {
  if (!native) return
  if (visible) {
    owner = id
    reserve((await ALF.Instance.Ads.GetAdHeight('banner')) + BANNER_GAP)
    enqueue(async () => {
      if (owner !== id) return
      if (created) await ALF.Instance.Ads.ShowBannerAd()
      else {
        created = true
        await ALF.Instance.Ads.InitBannerAd({ position: 'BOTTOM_CENTER', size: 'BANNER' })
      }
    })
  } else if (created) {
    reserve(0)
    enqueue(() => ALF.Instance.Ads.HideBannerAd())
  }
}

watch(() => props.visible, apply, { immediate: true })

onBeforeUnmount(() => {
  if (!native || owner !== id) return
  owner = null
  reserve(0)
  enqueue(() => ALF.Instance.Ads.DestroyBannerAd())
})
</script>

<template />
