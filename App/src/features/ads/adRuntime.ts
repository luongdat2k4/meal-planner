import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF, ALFAdMob } from '@alf/app-sdk'
import { adsConfig, initAds } from './adsConfig'

// Shared state of the ad layer. Ads only exist in the native app: on the web `adsAvailable` stays false, so no ad
// box, label or reserved space is drawn.

const initialized = ref(false)
export const adsAvailable = computed(() => Capacitor.isNativePlatform() && initialized.value)

// Bottom sheets and similar layers that open above the page. Native ad views are drawn above the WebView, so they
// have to be hidden while one is open.
const overlayCount = ref(0)
// A text field has the keyboard open; ads must never sit on top of it.
const keyboardOpen = ref(false)
export const adsSuppressed = computed(() => overlayCount.value > 0 || keyboardOpen.value)

let initialization: Promise<void> | undefined
export function initializeAds(): Promise<void> {
  return (initialization ??= initAds()
    .then(() => {
      initialized.value = true
    })
    .catch((error) => console.warn('[ads] init failed', error)))
}

/** Counts `open` as an overlay for as long as it is true. */
export function useOverlayFlag(open: Ref<boolean>) {
  let counted = false
  const sync = (value: boolean) => {
    if (value === counted) return
    counted = value
    overlayCount.value += value ? 1 : -1
  }
  watch(open, sync, { immediate: true })
  onBeforeUnmount(() => sync(false))
}

const TEXT_INPUT = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea'

if (Capacitor.isNativePlatform()) {
  document.addEventListener('focusin', (event) => {
    keyboardOpen.value = (event.target as Element | null)?.matches?.(TEXT_INPUT) ?? false
  })
  document.addEventListener('focusout', () => {
    // The next field may take focus right away; look again after the browser has settled.
    setTimeout(() => {
      keyboardOpen.value = document.activeElement?.matches?.(TEXT_INPUT) ?? false
    })
  })
}

// Full-screen interstitial. Shown only at a natural transition (finishing setup), loaded ahead of time so the
// transition never waits for it, and skipped silently when it is not ready: the caller always carries on afterwards.
const TEST_INTERSTITIAL = {
  android: 'ca-app-pub-3940256099942544/1033173712',
  ios: 'ca-app-pub-3940256099942544/4411468910',
}

function interstitialUnit(): string | undefined {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
  return adsConfig.settings?.testAds === true ? TEST_INTERSTITIAL[platform] : adsConfig.keys?.admob?.[platform]?.interstitial || undefined
}

export async function preloadInterstitial(): Promise<void> {
  await initializeAds()
  const adUnitId = interstitialUnit()
  if (!adsAvailable.value || !adUnitId) return
  try {
    await ALFAdMob.loadInterstitial({ adUnitId })
  } catch (error) {
    console.warn('[ads] interstitial not loaded', error)
  }
}

let interstitialShowing = false

/** Resolves when the ad has been closed, or at once when there is nothing to show. Never rejects. */
export async function showInterstitial(): Promise<void> {
  const adUnitId = interstitialUnit()
  if (!adsAvailable.value || !adUnitId || interstitialShowing || document.hidden) return
  const handles: Array<{ remove: () => Promise<void> | void }> = []
  try {
    if (await ALF.Instance.Ads.IsAdsRemoved()) return
    if (!(await ALFAdMob.isInterstitialReady({ adUnitId })).ready) return
    interstitialShowing = true
    await new Promise<void>((resolve) => {
      // The watchdog releases the caller if the native callback is lost.
      const timer = setTimeout(resolve, 120_000)
      const done = () => {
        clearTimeout(timer)
        resolve()
      }
      void (async () => {
        try {
          handles.push(await ALFAdMob.addListener('OnInterstitialAdDismissedEvent', done))
          handles.push(await ALFAdMob.addListener('OnInterstitialAdFailedToShowEvent', done))
          await ALFAdMob.showInterstitial({ adUnitId })
        } catch {
          done()
        }
      })()
    })
  } catch (error) {
    console.warn('[ads] interstitial skipped', error)
  } finally {
    for (const handle of handles) void handle.remove()
    interstitialShowing = false
  }
}
