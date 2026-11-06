import { computed, ref } from 'vue'
import { ALFAppLovinMAX } from '@alf/app-sdk'
import { AdFollow } from './adFollow'
import { maxUnit } from './adsConfig'

// One AppLovin MREC view shared by every ad slot. It is created once (ahead of time, off screen) and afterwards only
// moved, shown and hidden: creating and destroying a view per slot restarts the load, and two slots on one unit would
// fight over it. The slot that asked last owns the view; a slot that lost it cannot hide or move the new owner's.

type Rect = { x: number; y: number; width: number; height: number }
/** The ad's top edge inside the page and the band it may show in (CSS px), for screens that scroll on the document. */
export type Follow = { pageTop: number; clipTop: number; clipBottom: number }

// What the shared MREC is doing, for the slots' placeholder: shimmer while loading, a still background otherwise.
// `slow` (no ad after 10 s) only stops the shimmer; the slot keeps its size and the ad still fills it if it arrives.
// MAX retries on its own after a failure, so `failed` is not final: the ad can still appear over the background.
export type MrecState = 'idle' | 'loading' | 'slow' | 'ready' | 'failed'
const LOADING_MS = 10_000
export const mrecState = ref<MrecState>('idle')
export const mrecLoading = computed(() => mrecState.value === 'idle' || mrecState.value === 'loading')

const OFF_SCREEN: Rect = { x: 0, y: -2000, width: 300, height: 250 }

let queue: Promise<unknown> = Promise.resolve()
let created = false
let owner: string | null = null
let following = false
let lastRectKey = ''

// Native commands run one after another so a quick hide/show cannot interleave.
function run<T>(action: () => Promise<T>): Promise<T> {
  const result = queue.then(action)
  queue = result.catch(() => undefined)
  return result
}

// createMRec only resolves once the first ad has loaded, and rejects when there is none (no fill). The view exists
// either way and MAX keeps retrying, so the call is not waited for: later commands go straight after it.
function create(adUnitId: string, rect: Rect) {
  created = true
  mrecState.value = 'loading'
  setTimeout(() => {
    if (mrecState.value === 'loading') mrecState.value = 'slow'
  }, LOADING_MS)
  ALFAppLovinMAX.createMRec({ adUnitId, position: 'CENTER', rect }).then(
    () => (mrecState.value = 'ready'),
    (error) => {
      console.warn('[ads] MREC load', error)
      mrecState.value = 'failed'
    },
  )
}

/** Creates the view off screen and hidden so an ad is already loading when the first slot needs it. */
export function preloadMrec(): Promise<void> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId) return Promise.resolve()
  return run(async () => {
    if (created) return
    create(adUnitId, OFF_SCREEN)
    await ALFAppLovinMAX.hideMRec({ adUnitId })
  }).catch((error) => console.warn('[ads] MREC preload failed', error))
}

async function place(adUnitId: string, rect: Rect, follow?: Follow) {
  // In follow mode the vertical position is Android's job; the rect only has to be re-sent when it changes sideways or in size.
  const rectKey = follow ? `${rect.x},${rect.width},${rect.height}` : ''
  if (!follow || rectKey !== lastRectKey) await ALFAppLovinMAX.updateMRecRect({ adUnitId, rect })
  lastRectKey = rectKey
  if (follow) {
    following = true
    await AdFollow.follow({ adUnitId, ...follow })
  } else if (following) {
    following = false
    await AdFollow.unfollow({ adUnitId })
  }
}

/** Puts the view over `rect` for `slot`. False when MAX has no unit, so the caller can use another network. */
export function showMrec(slot: string, rect: Rect, follow?: Follow): Promise<boolean> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId) return Promise.resolve(false)
  owner = slot
  return run(async () => {
    if (owner !== slot) return true
    try {
      if (created) {
        lastRectKey = ''
        await place(adUnitId, rect, follow)
        await ALFAppLovinMAX.showMRec({ adUnitId })
      } else {
        create(adUnitId, rect)
        lastRectKey = follow ? `${rect.x},${rect.width},${rect.height}` : ''
        if (follow) {
          following = true
          await AdFollow.follow({ adUnitId, ...follow })
        }
      }
      return true
    } catch (error) {
      console.warn('[ads] MAX MREC failed', error)
      return false
    }
  })
}

export function moveMrec(slot: string, rect: Rect, follow?: Follow): Promise<void> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId || owner !== slot) return Promise.resolve()
  return run(async () => {
    if (owner === slot) await place(adUnitId, rect, follow)
  }).catch((error) => console.warn('[ads] MREC move failed', error))
}

/** Hides the view if `slot` still owns it. Never destroys it. */
export function hideMrec(slot: string): Promise<void> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId || owner !== slot) return Promise.resolve()
  owner = null
  return run(async () => {
    await ALFAppLovinMAX.hideMRec({ adUnitId })
    if (following) {
      following = false
      await AdFollow.unfollow({ adUnitId })
    }
  }).catch((error) => console.warn('[ads] MREC hide failed', error))
}
