import { migrateLegacyScope } from './migrate-scope'

let store: Record<string, unknown>
let local: Map<string, string>

beforeEach(() => {
  store = {}
  local = new Map()
  ;(globalThis as { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => Object.assign(store, items)
      }
    }
  }
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => local.get(key) ?? null,
    removeItem: (key: string) => local.delete(key)
  }
})

test('carries a legacy mine choice into chrome.storage and removes the old key', async () => {
  local.set('pipes-scope', 'mine')
  await migrateLegacyScope()
  expect(store.scope).toBe('mine')
  expect(local.has('pipes-scope')).toBe(false)
})

test('a legacy all choice is dropped without writing (all is the default)', async () => {
  local.set('pipes-scope', 'all')
  await migrateLegacyScope()
  expect(store.scope).toBeUndefined()
  expect(local.has('pipes-scope')).toBe(false)
})

test('no legacy key is a no-op', async () => {
  await migrateLegacyScope()
  expect(store.scope).toBeUndefined()
})
