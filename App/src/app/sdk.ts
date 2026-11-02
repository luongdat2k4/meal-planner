import { initSDK, type Config, type SDKStatus } from '@alf/app-sdk'
import { version } from '../../package.json'
import { lang } from '../shared/i18n'

// Connects the app to @alf/app-sdk (ads, analytics, Firebase, IAP, ...). Only the SDK's controllers are used; the
// app keeps its own language, onboarding and settings screens, so the SDK's setup-flow overlays and style.css are not
// loaded.

// Google's public sample ad units: they always serve test ads and are safe to ship in a dev build.
// Replace them with the real AdMob ids before a store release (and see `testAds` below).
const ADMOB_TEST = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    openApp: 'ca-app-pub-3940256099942544/9257395921',
    native: 'ca-app-pub-3940256099942544/2247696110',
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    openApp: 'ca-app-pub-3940256099942544/5575463023',
    native: 'ca-app-pub-3940256099942544/3986624511',
  },
}

// The SDK names Vietnamese 'vi'; the app calls it 'vn'.
const sdkLocale = () => (lang.value === 'vn' ? 'vi' : 'en')

const config = (): Config => ({
  settings: {
    dev: import.meta.env.DEV,
    // Every ad is a test ad until this is switched off for a store build.
    testAds: true,
    isGame: false,
    isApp: true,
    appName: 'Meal Planner',
    appVersion: version,
    environment: import.meta.env.DEV ? 'dev' : 'production',
    defaultLocale: sdkLocale(),
  },
  keys: {
    admob: ADMOB_TEST,
    // applovin, appsflyer, firebase: add the keys here when the app has them. initSDK skips a service whose keys
    // are missing and reports it as 'fail' in the returned status.
  },
})

/** Starts the SDK once the app is on screen. Never throws: a broken SDK must not stop the meal planner. */
export async function startSdk(): Promise<SDKStatus | null> {
  try {
    const status = await initSDK(config())
    console.info('[sdk] started', status)
    return status
  } catch (error) {
    console.error('[sdk] could not start', error)
    return null
  }
}
