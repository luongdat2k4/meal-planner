import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { ALF, ALFAppLovinMAX } from '@alf/app-sdk'
import { maxUnit } from './adsConfig'

// Banner ads exist only on the device. The strip for them is reserved from the first frame, before anyone knows
// whether an ad will come, so a banner that arrives (or never arrives) cannot move the layout.
export const adsPossible = Capacitor.isNativePlatform()

// A phone banner is 50px (a tablet's 90px is corrected once the native side answers), so the common case never moves.
export const bannerHeight = ref(adsPossible ? 50 : 0)

export function syncBannerHeight() {
  if (adsPossible) void ALF.Instance.Ads.GetAdHeight('banner').then((height) => (bannerHeight.value = height))
}

// The banner is a native view over the WebView, created once and afterwards only hidden and shown: re-creating it
// restarts the ad network's load. With a MAX unit it is created here, directly, ahead of time; the SDK's own
// InitBannerAd is used only when there is no MAX unit, and the two are never mixed (the SDK would add a second one).
// Commands wait in the queue until the SDK has started (adRuntime calls sdkReady()): a banner asked for before that
// would fail with "MAX SDK not initialized".
let sdkReady!: () => void
let queue: Promise<unknown> = new Promise<void>((resolve) => (sdkReady = resolve))
let created = false

export const markBannerSdkReady = () => sdkReady()

function run(action: () => Promise<unknown>) {
  queue = queue.then(action).catch((error) => console.warn('[ads] banner failed', error))
}

// createBanner only resolves once the first ad has loaded and rejects when there is none (no fill). The view exists
// either way and MAX keeps retrying, so the call is not waited for.
function create(adUnitId: string) {
  created = true
  void ALFAppLovinMAX.createBanner({ adUnitId, position: 'BOTTOM_CENTER' }).catch((error) => console.warn('[ads] banner load', error))
}

/** Creates the MAX banner hidden, so its first ad is already loading when a screen asks for it. */
export function preloadBanner() {
  const adUnitId = maxUnit('banner')
  if (!adsPossible || !adUnitId) return
  run(async () => {
    if (created) return
    create(adUnitId)
    await ALFAppLovinMAX.hideBanner({ adUnitId })
  })
}

export function showBanner() {
  if (!adsPossible) return
  const adUnitId = maxUnit('banner')
  run(async () => {
    if (!adUnitId) {
      if (created) await ALF.Instance.Ads.ShowBannerAd()
      else {
        created = true
        await ALF.Instance.Ads.InitBannerAd({ position: 'BOTTOM_CENTER', size: 'BANNER' })
      }
      return
    }
    if (!created) create(adUnitId)
    await ALFAppLovinMAX.showBanner({ adUnitId })
  })
}

export function hideBanner() {
  if (!adsPossible || !created) return
  const adUnitId = maxUnit('banner')
  run(() => (adUnitId ? ALFAppLovinMAX.hideBanner({ adUnitId }) : ALF.Instance.Ads.HideBannerAd()))
}

export function destroyBanner() {
  if (!adsPossible || !created) return
  const adUnitId = maxUnit('banner')
  created = false
  run(() => (adUnitId ? ALFAppLovinMAX.destroyBanner({ adUnitId }) : ALF.Instance.Ads.DestroyBannerAd()))
}
