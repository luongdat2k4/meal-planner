import { registerPlugin } from '@capacitor/core'

// Android only (see AdFollowPlugin.java): lets the native side move an ad view with the page's own scroll, in the
// frame being drawn, instead of JS sending its position on every scroll event.
export interface AdFollowPlugin {
  /** `pageTop` is the ad's top edge inside the page (viewport top + scroll), `clipTop`/`clipBottom` the band it may show in. All in CSS px. */
  follow(options: { adUnitId: string; pageTop: number; clipTop: number; clipBottom: number }): Promise<void>
  unfollow(options: { adUnitId: string }): Promise<void>
}

export const AdFollow = registerPlugin<AdFollowPlugin>('AdFollow')
