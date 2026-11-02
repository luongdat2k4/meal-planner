import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// The colour behind the phone's status bar, per screen (RouteMeta.statusBar), and how it is applied.
//
// Android 15+ draws the app edge to edge and no longer lets the app set the status bar colour, so the colour is
// painted by the web page itself, in a strip as tall as the status bar (see App.vue). On older Android and on iOS
// the native plugin is asked as well. On the web the browser's theme-color is updated.

export const DEFAULT_STATUS_BAR = '#f6f3fb'

const isLight = (hex: string) => {
  const value = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

export async function applyStatusBar(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  if (!Capacitor.isNativePlatform()) return
  try {
    // Style.Light is dark text for a light background.
    await StatusBar.setStyle({ style: isLight(color) ? Style.Light : Style.Dark })
    await StatusBar.setBackgroundColor({ color })
  } catch {
    // Not supported on this Android version (15+) or platform: the strip drawn by the page covers it.
  }
}
