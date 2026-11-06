import { Capacitor } from '@capacitor/core'
import { ALF, type Config } from '@alf/app-sdk'
import { version } from '../../../package.json'

// Placement settings in one place. Policy notes: design-note/plans/ads-meal-planner.md.

// Space kept between the banner and the tab bar so a tap meant for the bar cannot land on the ad.
export const BANNER_GAP = 12

// Height in CSS px of the native ad templates: the box the page reserves and the SDK draws into.
export const NATIVE_HEIGHTS = { small: 120, medium: 320, mrec: 250 } as const

// Google's official test app IDs. `settings.testAds` (1.9.0+) makes AdController
// request Google's test ad units for every format, so ads fill without a real
// AdMob account. Replace both app IDs and the ad units, then set
// `testAds: false` and `dev: false`, before shipping.
const TEST_APP_ID = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
}

export const adsConfig: Config = {
  settings: {
    dev: true,
    testAds: true,
    isGame: false,
    isApp: true,
    appName: 'Meal Planner',
    appVersion: version,
    environment: 'dev',
  },
  keys: {
    applovin: {
      android: {
        sdkKey: 'eQt0q3679KmUyKeNcSzqC01eB-lILmfTnJoufGxpSn__n1NVhHLeMgxZOaICke451El4ZBfuZum9Qw4WxzpW52',
        banner: 'ea8d2ebb0b6ef2e7',
        mrec: 'cf603e7a53e88c1c',
        interstitial: '028e0cb9bd3d86a3',
        rewarded: '',
        appOpen: '',
      },
      // iOS ad units are not created yet.
      ios: { sdkKey: '', banner: '', mrec: '', interstitial: '', rewarded: '', appOpen: '' },
    },
    admob: {
      android: { appId: TEST_APP_ID.android, banner: '', interstitial: '', rewarded: '', openApp: '', native: '' },
      ios: { appId: TEST_APP_ID.ios, banner: '', interstitial: '', rewarded: '', openApp: '', native: '' },
    },
  },
}

const platform = () => (Capacitor.getPlatform() === 'ios' ? 'ios' : 'android')

/** True when this platform has an AppLovin SDK key, so MAX can start. */
export const appLovinReady = !!adsConfig.keys.applovin?.[platform()]?.sdkKey

/** The MAX unit for a format on this platform, or undefined while MAX is off or the unit is empty. */
export function maxUnit(format: 'banner' | 'mrec' | 'interstitial'): string | undefined {
  return appLovinReady ? adsConfig.keys.applovin?.[platform()]?.[format] || undefined : undefined
}

// Ads only: the rest of the framework (analytics, push, i18n, IAP) is not
// initialised, so booting it cannot prompt or log anything the app didn't ask for.
export async function initAds(): Promise<void> {
  const alf = ALF.Instance
  await alf.initControllers()
  alf.Config.set(adsConfig)
  // MAX serves the banner, MREC and interstitials, so only it is waited for. AdMob starts alongside and is only
  // awaited when the AdMob test units are in use (testAds) or an app-open unit is loaded.
  adMobReady = alf.Ads.initAdMob()
  adMobReady.catch(() => {})
  if (appLovinReady) await alf.Ads.init()
  else console.warn('[ads] AppLovin sdkKey is empty: MAX is off, AdMob only')
  if (adsConfig.settings?.testAds === true) await adMobReady
}

export let adMobReady: Promise<void> = Promise.resolve()
