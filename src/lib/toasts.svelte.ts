export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  variant: ToastVariant
  title: string
  message?: string
  action?: { label: string; run: () => void }
  undo?: boolean
}

let nextId = 1
export const toasts = $state<ToastItem[]>([])

function add(item: Omit<ToastItem, 'id'>, ms: number): number {
  const id = nextId++
  toasts.push({ id, ...item })
  if (ms > 0) {
    setTimeout(() => dismiss(id), ms)
  }
  return id
}

export function dismiss(id: number): void {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.splice(index, 1)
  }
}

export function toastSuccess(title: string, message?: string): number {
  return add({ variant: 'success', title, message }, 4000)
}

export function toastError(title: string, message?: string): number {
  return add({ variant: 'error', title, message }, 6000)
}

export function toastInfo(title: string, message?: string): number {
  return add({ variant: 'info', title, message }, 4000)
}

/** Destructive-action pattern: "<title> · Undo", ~5s, runs onUndo if pressed. */
export function toastUndo(title: string, onUndo: () => void): number {
  return add({ variant: 'info', title, undo: true, action: { label: 'Undo', run: onUndo } }, 5000)
}
