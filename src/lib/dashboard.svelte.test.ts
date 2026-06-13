import { flushSync } from 'svelte'
import { useDashboard } from './dashboard.svelte'

// Capture the storage.subscribe callbacks so a test can push values and watch the derivations react.
const subs = new Map<string, (value: unknown) => void>()

vi.mock('./storage', () => ({
  get: async () => ({}),
  subscribe: (key: string, callback: (value: unknown) => void) => {
    subs.set(key, callback)
    return () => subs.delete(key)
  }
}))

function account(id: string, label: string) {
  return { id, provider: 'github' as const, label, host: 'https://github.com', token: 't' }
}

beforeEach(() => {
  subs.clear()
  // holdLivePort opens a keep-alive port; stub just enough chrome for it.
  globalThis.chrome = {
    runtime: {
      connect: () => ({ onDisconnect: { addListener: () => {} }, disconnect: () => {} }),
      sendMessage: () => Promise.resolve()
    }
  } as unknown as typeof chrome
})

test('rateLimited lists only accounts paused into the future, with their resume time', () => {
  const now = Math.floor(Date.now() / 1000)
  let dashboard!: ReturnType<typeof useDashboard>
  const cleanup = $effect.root(() => {
    dashboard = useDashboard()
  })
  flushSync() // run the wiring effect so the subscriptions register

  subs.get('accounts')!([account('a', 'work'), account('b', 'home')])
  subs.get('rateLimitPausedUntil')!({ a: now + 600, b: now - 600 }) // b's pause already expired
  flushSync()

  expect(dashboard.rateLimited.map((entry) => entry.id)).toEqual(['a'])
  expect(dashboard.rateLimited[0]).toMatchObject({ label: 'work', resumesAt: now + 600 })
  cleanup()
})

test('connectionIssues lists only accounts whose health is not ok, with the error', () => {
  let dashboard!: ReturnType<typeof useDashboard>
  const cleanup = $effect.root(() => {
    dashboard = useDashboard()
  })
  flushSync()

  subs.get('accounts')!([account('a', 'work'), account('b', 'home')])
  subs.get('accountHealth')!({ a: { ok: false, error: 'bad token' }, b: { ok: true } })
  flushSync()

  expect(dashboard.connectionIssues).toEqual([{ id: 'a', label: 'work', error: 'bad token' }])
  cleanup()
})

test('a rate-limited account is not also a connection issue (healthy but paused)', () => {
  const now = Math.floor(Date.now() / 1000)
  let dashboard!: ReturnType<typeof useDashboard>
  const cleanup = $effect.root(() => {
    dashboard = useDashboard()
  })
  flushSync()

  // The poll loop keeps a rate-limited account healthy and records a pause — the #100 contract.
  subs.get('accounts')!([account('a', 'work')])
  subs.get('accountHealth')!({ a: { ok: true } })
  subs.get('rateLimitPausedUntil')!({ a: now + 600 })
  flushSync()

  expect(dashboard.connectionIssues).toEqual([])
  expect(dashboard.rateLimited.map((entry) => entry.id)).toEqual(['a'])
  cleanup()
})
