<script lang="ts">
let owner: symbol | null = null
let operation = Promise.resolve()
function enqueue(action: () => Promise<void>) {
  operation = operation.then(action).catch((error) => console.warn('[ads] banner failed', error))
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF } from '@alf/app-sdk'
import { BANNER_GAP } from '../adsConfig'

// AdMob draws the banner over the WebView, anchored to the bottom edge of the screen, so this component draws
// nothing itself: it creates the banner while mounted and reserves the strip by raising --ad-bottom, which the tab
// bar and the page padding follow. A fixed 320x50 banner is used so the page knows the height it has to reserve.
const native = Capacitor.isNativePlatform()
const id = Symbol('banner-host')

function reserve(px: number) {
  document.documentElement.style.setProperty('--ad-bottom', `${px}px`)
}

onMounted(async () => {
  if (!native) return
  owner = id
  reserve((await ALF.Instance.Ads.GetAdHeight('banner')) + BANNER_GAP)
  enqueue(async () => {
    if (owner === id) await ALF.Instance.Ads.InitBannerAd({ position: 'BOTTOM_CENTER', size: 'BANNER' })
  })
})

onBeforeUnmount(() => {
  if (!native || owner !== id) return
  owner = null
  reserve(0)
  enqueue(() => ALF.Instance.Ads.DestroyBannerAd())
})
</script>

<template />
