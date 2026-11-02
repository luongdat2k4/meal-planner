import { ALF, type Config } from '@alf/app-sdk'
import { version } from '../../../package.json'

// Placement settings in one place. Policy notes: design-note/plans/ads-meal-planner.md.

// Space kept between the banner and the tab bar so a tap meant for the bar cannot land on the ad.
export const BANNER_GAP = 12

// Height in CSS px of the native ad templates: the box the page reserves and the SDK draws into.
export const NATIVE_HEIGHTS = { small: 120, medium: 320, mrec: 250 } as const

// Google's public sample app ids. With `testAds` the SDK requests Google's test unit for every format, so ads fill
// without a real AdMob account. Before a store release: replace the app ids (here AND in AndroidManifest.xml),
// add the ad units, and set `testAds: false`.
const TEST_APP_ID = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
}

const units = { banner: '', interstitial: '', rewarded: '', openApp: '', native: '' }

export const adsConfig: Config = {
  settings: {
    dev: import.meta.env.DEV,
    testAds: true,
    isGame: false,
    isApp: true,
    appName: 'Meal Planner',
    appVersion: version,
    environment: import.meta.env.DEV ? 'dev' : 'production',
  },
  keys: {
    admob: {
      android: { appId: TEST_APP_ID.android, ...units },
      ios: { appId: TEST_APP_ID.ios, ...units },
    },
  },
}

// Ads only: the rest of the framework (analytics, push, i18n, IAP) is not initialised, so booting it cannot prompt
// or log anything the app didn't ask for.
export async function initAds(): Promise<void> {
  const alf = ALF.Instance
  await alf.initControllers()
  alf.Config.set(adsConfig)
  await alf.Ads.initAdMob()
}
