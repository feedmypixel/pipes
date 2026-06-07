import * as storage from './storage'

let store: Record<string, unknown>

beforeEach(() => {
  store = {}
  ;(globalThis as { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => Object.assign(store, items),
        remove: async (keys: string[]) => keys.forEach((key) => delete store[key])
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

test('set stores a plain clone, not the live reference (strips Svelte $state proxies)', async () => {
  const live = [{ id: 'a' }]
  await storage.set('accounts', live as never)
  live[0].id = 'mutated'
  // Stored value is decoupled from the caller's (proxied) object.
  expect((await storage.get('accounts'))[0].id).toBe('a')
  // And it survives the array shape guard (a proxy cloned as an object would not).
  expect(Array.isArray(await storage.get('accounts'))).toBe(true)
})

test('migrate clears shape-changed caches and stamps the schema version', async () => {
  store.snapshots = { 'o/r': [{ ref: 'main' }] } // old per-ref shape
  store.branchCache = { 'o/r': { names: ['main'], etag: 'x' } }
  store.accounts = [{ id: 'a' }]
  await storage.migrate()
  expect(store.snapshots).toBeUndefined()
  expect(store.branchCache).toBeUndefined()
  expect(store.accounts).toEqual([{ id: 'a' }]) // accounts/settings untouched
  expect(store.schemaVersion).toBe(2)
})

test('migrate is a no-op once the schema version matches', async () => {
  store.schemaVersion = 2
  store.snapshots = { keep: { default: null, changes: [] } }
  await storage.migrate()
  expect(store.snapshots).toEqual({ keep: { default: null, changes: [] } })
})
