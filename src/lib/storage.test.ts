import * as storage from './storage'

let store: Record<string, unknown>

beforeEach(() => {
  store = {}
  ;(globalThis as { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => Object.assign(store, items)
      }
    }
  }
})

test('returns the stored value when it matches the shape', async () => {
  store.accounts = [{ id: 'a' }]
  expect(await storage.get('accounts')).toEqual([{ id: 'a' }])
})

test('falls back to the default when the key is absent', async () => {
  expect(await storage.get('accounts')).toEqual([])
  expect(await storage.get('snapshots')).toEqual({})
})

test('heals a corrupt non-array accounts (the add-connection bug) → default', async () => {
  store.accounts = { 0: 'x' } // an object, not an array
  expect(await storage.get('accounts')).toEqual([])
})

test('heals a wrong-type object key (array where an object is expected)', async () => {
  store.settings = []
  expect((await storage.get('settings')).pollMinutes).toBeGreaterThan(0)
})

test('set round-trips through get', async () => {
  await storage.set('watchedRepos', [{ id: 'r' }] as never)
  expect(await storage.get('watchedRepos')).toEqual([{ id: 'r' }])
})
