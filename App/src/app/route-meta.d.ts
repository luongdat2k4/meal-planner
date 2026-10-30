import type { IconifyIcon } from '@iconify/vue'
import type { RouteLocationRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    // Present on routes shown in the bottom tab bar; `center` renders the raised round button.
    tab?: { label: string; icon: IconifyIcon; order: number; center?: boolean }
    // Hides the page header and tab bar; the screen draws its own chrome.
    fullscreen?: boolean
    // Shows a back button in the header that links here.
    backTo?: RouteLocationRaw
  }
}
