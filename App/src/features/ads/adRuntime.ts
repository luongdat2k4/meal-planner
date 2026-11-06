import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF, ALFAdMob, ALFAppLovinMAX } from '@alf/app-sdk'
import { adsConfig, initAds, maxUnit } from './adsConfig'
import { preloadMrec } from './mrec'

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
      void preloadMrec()
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

// Full-screen interstitial. Shown only at natural transitions (setup, onboarding, every few screens), loaded ahead of
// time so the transition never waits for it, and skipped silently when it is not ready: the caller always carries on
// afterwards. AppLovin MAX goes first; AdMob is used only when MAX has no ad ready.
const TEST_INTERSTITIAL = {
  android: 'ca-app-pub-3940256099942544/1033173712',
  ios: 'ca-app-pub-3940256099942544/4411468910',
}

const platformKey = () => (Capacitor.getPlatform() === 'ios' ? 'ios' : 'android')

function interstitialUnit(): string | undefined {
  const platform = platformKey()
  return adsConfig.settings?.testAds === true ? TEST_INTERSTITIAL[platform] : adsConfig.keys?.admob?.[platform]?.interstitial || undefined
}

export async function preloadInterstitial(): Promise<void> {
  await initializeAds()
  if (!adsAvailable.value) return
  const maxInterstitial = maxUnit('interstitial')
  const admobUnit = interstitialUnit()
  const loads: Array<Promise<unknown>> = []
  if (maxInterstitial) loads.push(ALFAppLovinMAX.loadInterstitial({ adUnitId: maxInterstitial }))
  if (admobUnit) loads.push(ALFAdMob.loadInterstitial({ adUnitId: admobUnit }))
  for (const result of await Promise.allSettled(loads)) {
    if (result.status === 'rejected') console.warn('[ads] interstitial not loaded', result.reason)
  }
}

let interstitialShowing = false

// When a full-screen ad (interstitial or launch ad) was last on screen: the pacing of the interstitials in between
// (see pacing.ts) counts from it.
let lastFullScreenAt = 0
export const msSinceFullScreenAd = () => Date.now() - lastFullScreenAt

type Handle = { remove: () => Promise<void> | void }

// Shows one interstitial and resolves when it has been closed or failed to show. The watchdog releases the caller if
// the native callback is lost.
function present(
  listen: (done: () => void, handles: Handle[]) => Promise<void>,
  show: () => Promise<unknown>,
  handles: Handle[],
): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 120_000)
    const done = () => {
      clearTimeout(timer)
      resolve()
    }
    void (async () => {
      try {
        await listen(done, handles)
        await show()
      } catch {
        done()
      }
    })()
  })
}

/** Resolves when the ad has been closed, or at once when there is nothing to show. Never rejects. */
export async function showInterstitial(): Promise<void> {
  const maxInterstitial = maxUnit('interstitial')
  const admobUnit = interstitialUnit()
  if (!adsAvailable.value || (!maxInterstitial && !admobUnit) || interstitialShowing || document.hidden) return
  const handles: Handle[] = []
  try {
    if (await ALF.Instance.Ads.IsAdsRemoved()) return
    if (maxInterstitial && (await ALFAppLovinMAX.isInterstitialReady({ adUnitId: maxInterstitial })).ready) {
      interstitialShowing = true
      lastFullScreenAt = Date.now()
      await present(
        async (done, list) => {
          list.push(await ALFAppLovinMAX.addListener('OnInterstitialAdHiddenEvent', done))
          list.push(await ALFAppLovinMAX.addListener('OnInterstitialAdDisplayFailedEvent', done))
        },
        () => ALFAppLovinMAX.showInterstitial({ adUnitId: maxInterstitial, placement: 'app_flow' }),
        handles,
      )
    } else if (admobUnit && (await ALFAdMob.isInterstitialReady({ adUnitId: admobUnit })).ready) {
      interstitialShowing = true
      lastFullScreenAt = Date.now()
      await present(
        async (done, list) => {
          list.push(await ALFAdMob.addListener('OnInterstitialAdDismissedEvent', done))
          list.push(await ALFAdMob.addListener('OnInterstitialAdFailedToShowEvent', done))
        },
        () => ALFAdMob.showInterstitial({ adUnitId: admobUnit }),
        handles,
      )
    }
  } catch (error) {
    console.warn('[ads] interstitial skipped', error)
  } finally {
    for (const handle of handles) void handle.remove()
    interstitialShowing = false
  }
}

// Full-screen ad for the launch screen (/begin). AppLovin MAX goes first, as a full-screen interstitial (the MAX app
// open unit is not set up); AdMob's App Open ad is the fallback. Everything is bounded by one deadline; a late ad is
// never shown over the next screen. Resolves when the ad is closed or at once when there is nothing to show. Never
// rejects.
const TEST_APP_OPEN = {
  android: 'ca-app-pub-3940256099942544/9257395921',
  ios: 'ca-app-pub-3940256099942544/5575463023',
}

function appOpenUnit(): string | undefined {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
  return adsConfig.settings?.testAds === true ? TEST_APP_OPEN[platform] : adsConfig.keys?.admob?.[platform]?.openApp || undefined
}

function withTimeout<T>(operation: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([operation, new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error('ad timed out')), ms)))]).finally(() =>
    clearTimeout(timer),
  )
}

// Loads the MAX interstitial and shows it once ready. False when MAX has no unit or no ad within the deadline.
async function showMaxLaunchAd(within: <T>(operation: Promise<T>) => Promise<T>, onShowing?: () => void): Promise<boolean> {
  const adUnitId = maxUnit('interstitial')
  if (!adUnitId) return false
  const handles: Handle[] = []
  try {
    await within(ALFAppLovinMAX.loadInterstitial({ adUnitId }))
    // The load call returns before the ad has arrived: wait for it until the deadline.
    for (;;) {
      if ((await within(ALFAppLovinMAX.isInterstitialReady({ adUnitId }))).ready) break
      await within(new Promise((resolve) => setTimeout(resolve, 250)))
    }
    if (document.hidden) return false
    interstitialShowing = true
    onShowing?.()
    lastFullScreenAt = Date.now()
    await present(
      async (done, list) => {
        list.push(await ALFAppLovinMAX.addListener('OnInterstitialAdHiddenEvent', done))
        list.push(await ALFAppLovinMAX.addListener('OnInterstitialAdDisplayFailedEvent', done))
      },
      () => ALFAppLovinMAX.showInterstitial({ adUnitId, placement: 'app_launch' }),
      handles,
    )
    return true
  } catch (error) {
    console.warn('[ads] MAX launch ad skipped', error)
    return false
  } finally {
    for (const handle of handles) void handle.remove()
    interstitialShowing = false
  }
}

let appOpenAttempted = false

export async function showAppOpenAd(loadWindowMs: number, onShowing?: () => void): Promise<void> {
  if (appOpenAttempted) return
  appOpenAttempted = true
  const deadline = Date.now() + loadWindowMs
  const within = <T,>(operation: Promise<T>) => withTimeout(operation, Math.max(0, deadline - Date.now()))
  let handle: { remove: () => Promise<void> | void } | undefined
  try {
    await within(initializeAds())
    if (!adsAvailable.value || document.hidden) return
    if (await within(ALF.Instance.Ads.IsAdsRemoved())) return
    if (await showMaxLaunchAd(within, onShowing)) return
    const adUnitId = appOpenUnit()
    if (!adUnitId) return
    await within(ALFAdMob.loadOpenAppAd({ adUnitId }))
    if (!(await within(ALFAdMob.isOpenAppAdReady({ adUnitId }))).ready || document.hidden) return
    let closed!: () => void
    const dismissed = new Promise<void>((resolve) => (closed = resolve))
    handle = await within(ALFAdMob.addListener('OnOpenAppAdDismissedEvent', () => closed()))
    onShowing?.()
    lastFullScreenAt = Date.now()
    await ALFAdMob.showOpenAppAd({ adUnitId })
    // Showing resolves when the ad opens; wait for it to be closed. The watchdog releases the caller if the native
    // callback is lost.
    await Promise.race([dismissed, new Promise((resolve) => setTimeout(resolve, 60_000))])
  } catch (error) {
    console.warn('[ads] launch ad skipped', error)
  } finally {
    void handle?.remove()
  }
}
