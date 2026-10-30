import { reactive } from 'vue'

interface Toast {
  id: number
  message: string
}

const toasts = reactive<Toast[]>([])
let nextId = 1

export function showToast(message: string, durationMs = 2200) {
  const id = nextId++
  toasts.push({ id, message })
  setTimeout(() => {
    const index = toasts.findIndex((toast) => toast.id === id)
    if (index >= 0) toasts.splice(index, 1)
  }, durationMs)
}

export function useToasts() {
  return toasts
}
