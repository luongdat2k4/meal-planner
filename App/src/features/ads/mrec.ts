import { ALFAppLovinMAX } from '@alf/app-sdk'
import { maxUnit } from './adsConfig'

// One AppLovin MREC view shared by every ad slot. It is created once (ahead of time, off screen) and afterwards only
// moved, shown and hidden: creating and destroying a view per slot restarts the load, and two slots on one unit would
// fight over it. The slot that asked last owns the view; a slot that lost it cannot hide or move the new owner's.

type Rect = { x: number; y: number; width: number; height: number }

const OFF_SCREEN: Rect = { x: 0, y: -2000, width: 300, height: 250 }

let queue: Promise<unknown> = Promise.resolve()
let created = false
let owner: string | null = null

// Native commands run one after another so a quick hide/show cannot interleave.
function run<T>(action: () => Promise<T>): Promise<T> {
  const result = queue.then(action)
  queue = result.catch(() => undefined)
  return result
}

/** Creates the view off screen and hidden so an ad is already loaded when the first slot needs it. */
export function preloadMrec(): Promise<void> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId) return Promise.resolve()
  return run(async () => {
    if (created) return
    await ALFAppLovinMAX.createMRec({ adUnitId, position: 'CENTER', rect: OFF_SCREEN })
    created = true
    await ALFAppLovinMAX.hideMRec({ adUnitId })
  }).catch((error) => console.warn('[ads] MREC preload failed', error))
}

/** Puts the view over `rect` for `slot`. False when MAX cannot show it, so the caller can use another network. */
export function showMrec(slot: string, rect: Rect): Promise<boolean> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId) return Promise.resolve(false)
  owner = slot
  return run(async () => {
    if (owner !== slot) return true
    try {
      if (created) {
        await ALFAppLovinMAX.updateMRecRect({ adUnitId, rect })
        await ALFAppLovinMAX.showMRec({ adUnitId })
      } else {
        await ALFAppLovinMAX.createMRec({ adUnitId, position: 'CENTER', rect })
        created = true
      }
      return true
    } catch (error) {
      console.warn('[ads] MAX MREC failed', error)
      return false
    }
  })
}

export function moveMrec(slot: string, rect: Rect): Promise<void> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId || owner !== slot) return Promise.resolve()
  return run(async () => {
    if (owner === slot) await ALFAppLovinMAX.updateMRecRect({ adUnitId, rect })
  }).catch((error) => console.warn('[ads] MREC move failed', error))
}

/** Hides the view if `slot` still owns it. Never destroys it. */
export function hideMrec(slot: string): Promise<void> {
  const adUnitId = maxUnit('mrec')
  if (!adUnitId || owner !== slot) return Promise.resolve()
  owner = null
  return run(() => ALFAppLovinMAX.hideMRec({ adUnitId })).catch((error) => console.warn('[ads] MREC hide failed', error))
}
