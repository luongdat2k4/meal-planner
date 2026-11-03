import type { Router } from 'vue-router'
import { adsAvailable, adsSuppressed, msSinceFullScreenAd, preloadInterstitial, showInterstitial } from './adRuntime'

// An interstitial every few screen changes, at the natural moment between two screens and never in the middle of an
// action: it is counted on arrival at a screen of the app (tab bar, settings...), not on taps that only change something
// on the current screen, and it appears a moment after the new screen is in place. A frequency cap in time keeps it
// from being tiring, and the setup, the welcome screens and the launch screen (/begin) neither count nor show it.
const EVERY = [2, 3] as const
const MIN_GAP_MS = 15_000
const SETTLE_MS = 600

const pick = () => EVERY[Math.floor(Math.random() * EVERY.length)]

export function startInterstitialPacing(router: Router) {
  let seen = 0
  let threshold = pick()
  void preloadInterstitial()

  router.afterEach((to, from) => {
    if (!from.name || to.meta.fullscreen || from.meta.fullscreen || to.fullPath === from.fullPath) return
    if (++seen < threshold) return
    // Not yet allowed (too soon, an ad could not be shown): keep counting and try again on the next screen change.
    if (!adsAvailable.value || msSinceFullScreenAd() < MIN_GAP_MS) return
    const arrived = to.fullPath
    setTimeout(async () => {
      // The user already moved on, or a sheet or the keyboard is open: not a good moment.
      if (router.currentRoute.value.fullPath !== arrived || adsSuppressed.value) return
      seen = 0
      threshold = pick()
      await showInterstitial()
      void preloadInterstitial()
    }, SETTLE_MS)
  })
}
