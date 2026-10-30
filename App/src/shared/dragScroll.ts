import { onBeforeUnmount, onMounted, type Ref } from 'vue'

// Lets a horizontally overflowing row scroll by dragging with the mouse. Touch and trackpads already
// scroll natively, but with the scrollbar hidden a mouse has no other way to reach the hidden items.
export function useDragScroll(target: Readonly<Ref<HTMLElement | null>>) {
  const DRAG_THRESHOLD = 4

  let dragging = false
  let moved = false
  let startX = 0
  let startScroll = 0

  function onPointerDown(event: PointerEvent) {
    const el = target.value
    if (!el || event.pointerType !== 'mouse' || event.button !== 0) return
    dragging = true
    moved = false
    startX = event.clientX
    startScroll = el.scrollLeft
  }

  function onPointerMove(event: PointerEvent) {
    const el = target.value
    if (!dragging || !el) return
    const delta = event.clientX - startX
    if (!moved && Math.abs(delta) > DRAG_THRESHOLD) {
      moved = true
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }
    if (moved) el.scrollLeft = startScroll - delta
  }

  function endDrag() {
    dragging = false
    const el = target.value
    if (el) {
      el.style.cursor = ''
      el.style.userSelect = ''
    }
  }

  // A drag must not count as a click on the chip it ended over.
  function onClickCapture(event: MouseEvent) {
    if (!moved) return
    event.preventDefault()
    event.stopPropagation()
    moved = false
  }

  onMounted(() => {
    target.value?.addEventListener('pointerdown', onPointerDown)
    target.value?.addEventListener('click', onClickCapture, true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  })

  onBeforeUnmount(() => {
    target.value?.removeEventListener('pointerdown', onPointerDown)
    target.value?.removeEventListener('click', onClickCapture, true)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  })
}
