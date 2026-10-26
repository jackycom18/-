import { readonly, ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: string
  duration: number
}

const items = ref<ToastItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let seed = 0

function remove(id: number): void {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  items.value = items.value.filter((item) => item.id !== id)
}

function show(message: string, type = 'create', duration = 2600): number {
  seed += 1
  const id = seed
  items.value = [...items.value, { id, message, type, duration }].slice(-3)
  const timer = setTimeout(() => remove(id), duration)
  timers.set(id, timer)
  return id
}

function success(message: string, type = 'create', duration?: number): number {
  return show(message, type, duration)
}

function error(message: string, duration = 2400): number {
  return show(message, 'error', duration)
}

function clear(): void {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  items.value = []
}

export function useToast() {
  return {
    toasts: readonly(items),
    show,
    success,
    error,
    remove,
    clear
  }
}