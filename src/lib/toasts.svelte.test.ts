import { toasts, dismiss, toastSuccess, toastError, toastInfo, toastUndo } from './toasts.svelte'

beforeEach(() => {
  toasts.splice(0)
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

test('toastSuccess pushes one success toast and returns its id', () => {
  const id = toastSuccess('Saved')
  expect(toasts).toHaveLength(1)
  expect(toasts[0]).toMatchObject({ id, variant: 'success', title: 'Saved' })
})

test('auto-dismisses after its lifetime', () => {
  toastSuccess('Saved')
  vi.advanceTimersByTime(3999)
  expect(toasts).toHaveLength(1)
  vi.advanceTimersByTime(1)
  expect(toasts).toHaveLength(0)
})

test('error lives longer than success', () => {
  toastError('Failed')
  vi.advanceTimersByTime(4000)
  expect(toasts).toHaveLength(1)
  vi.advanceTimersByTime(2000)
  expect(toasts).toHaveLength(0)
})

test('dismiss removes a specific toast, leaving others', () => {
  const first = toastInfo('One')
  toastInfo('Two')
  dismiss(first)
  expect(toasts.map((t) => t.title)).toEqual(['Two'])
})

test('toastUndo carries the undo action and runs it on demand', () => {
  let undone = false
  toastUndo('Connection removed', () => (undone = true))
  expect(toasts[0]).toMatchObject({ variant: 'info', undo: true })
  expect(toasts[0].action?.label).toBe('Undo')
  toasts[0].action?.run()
  expect(undone).toBe(true)
})
