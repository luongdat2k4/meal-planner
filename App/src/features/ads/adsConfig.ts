import { Capacitor } from '@capacitor/core'
import { ALF, type Config } from '@alf/app-sdk'
import { version } from '../../../package.json'

// Placement settings in one place. Policy notes: design-note/plans/ads-meal-planner.md.

// Space kept between the banner and the tab bar so a tap meant for the bar cannot land on the ad.
export const BANNER_GAP = 12

// Height in CSS px of the native ad templates: the box the page reserves and the SDK draws into.
export const NATIVE_HEIGHTS = { small: 120, medium: 320, mrec: 250 } as const

// Ad networks, in priority order: AppLovin MAX first (banner, MREC, interstitial), AdMob after it (native ads, the
// launch ad, and the fallback when MAX has nothing to show). The MAX ad unit ids come from the AppLovin dashboard;
// the SDK key is on its Account > Keys page and MAX does not start without it.
const APPLOVIN_SDK_KEY: string = 'eQt0q3679KmUyKeNcSzqC01eB-lILmfTnJoufGxpSn__n1NVhHLeMgxZOaICke451El4ZBfuZum9Qw4WxzpW52'

const applovinAndroid = {
  sdkKey: APPLOVIN_SDK_KEY,
  banner: 'ea8d2ebb0b6ef2e7',
  mrec: 'cf603e7a53e88c1c',
  interstitial: '028e0cb9bd3d86a3',
  rewarded: '',
  appOpen: '',
}
const applovinIos = { sdkKey: APPLOVIN_SDK_KEY, banner: '', mrec: '', interstitial: '', rewarded: '', appOpen: '' }

export const appLovinReady = APPLOVIN_SDK_KEY !== ''

/** The MAX unit for a format on this platform, or undefined while MAX is off or the unit is empty. */
export function maxUnit(format: 'banner' | 'mrec' | 'interstitial'): string | undefined {
  if (!appLovinReady) return undefined
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
  return adsConfig.keys?.applovin?.[platform]?.[format] || undefined
}

// Google's public sample app ids for AdMob. The AdMob units are still empty, so AdMob serves nothing until a real
// account is added: replace the app ids (here AND in AndroidManifest.xml) and fill `units`.
const TEST_APP_ID = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
}

const units = { banner: '', interstitial: '', rewarded: '', openApp: '', native: '' }

export const adsConfig: Config = {
  settings: {
    dev: import.meta.env.DEV,
    // Off so the SDK takes the MAX units above first; with it on the SDK serves Google's AdMob test units instead.
    testAds: false,
    isGame: false,
    isApp: true,
    appName: 'Meal Planner',
    appVersion: version,
    environment: import.meta.env.DEV ? 'dev' : 'production',
  },
  keys: {
    applovin: { android: applovinAndroid, ios: applovinIos },
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
  // MAX first; AdMob is started either way so it can back MAX up.
  if (appLovinReady) await alf.Ads.init()
  else console.warn('[ads] AppLovin sdkKey is empty: MAX is off, AdMob only')
  await alf.Ads.initAdMob()
}
