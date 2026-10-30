import { reactive } from 'vue'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: string
  action?: ToastAction
}

const toasts = reactive<Toast[]>([])
let nextId = 1

export function showToast(message: string, durationMs = 2200, action?: ToastAction) {
  const id = nextId++
  toasts.push({ id, message, action })
  setTimeout(() => {
    const index = toasts.findIndex((toast) => toast.id === id)
    if (index >= 0) toasts.splice(index, 1)
  }, durationMs)
}

export function useToasts() {
  return toasts
}
