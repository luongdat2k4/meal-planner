import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { initAds } from './adsConfig'

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
