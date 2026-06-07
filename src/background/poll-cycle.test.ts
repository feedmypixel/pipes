import { poll } from './poll'
import { RateLimitError } from '../providers/http'
import type { PipelineStatus } from '../providers/types'

// In-memory storage + provider/notify spies, wired via the module mocks below.
const h = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  provider: {
    validateToken: vi.fn(),
    listRepos: vi.fn(),
    listPipelines: vi.fn(),
    listBranches: vi.fn()
  },
  notify: {
    notifyMainFailed: vi.fn(),
    notifyBranchFailed: vi.fn(),
    notifyRecovered: vi.fn(),
    setBadge: vi.fn()
  }
}))

vi.mock('../lib/storage', () => ({
  get: async (key: string) => {
    if (h.store[key] !== undefined) {
      return h.store[key]
    }
    if (key === 'accounts' || key === 'watchedRepos') {
      return []
    }
    if (key === 'settings') {
      return { pollMinutes: 1, notifyOnSuccess: true }
    }
    if (key === 'lastPolledAt' || key === 'lastHealthAt') {
      return 0
    }
    return {}
  },
  set: async (key: string, value: unknown) => {
    h.store[key] = value
  }
}))
vi.mock('../lib/notify', () => h.notify)
vi.mock('../providers', () => ({ providerFor: () => h.provider }))

const account = {
  id: 'a1',
  provider: 'github' as const,
  label: 'work',
  host: 'https://github.com',
  token: 't'
}
const repo = { id: 'o/r', accountId: 'a1', name: 'o/r', defaultBranch: 'main', webUrl: 'https://x' }

function pipe(ref: string, status: PipelineStatus, isDefaultBranch: boolean) {
  return {
    id: `${ref}-${status}`,
    ref,
    isDefaultBranch,
    status,
    webUrl: `https://x/${ref}`,
    sha: 's',
    title: ref,
    updatedAt: '2026-06-07T00:00:00Z'
  }
}
function pipelines(list: ReturnType<typeof pipe>[]) {
  return { pipelines: list, etag: 'e', notModified: false, rateLimit: null }
}
function seed(overrides: Record<string, unknown> = {}) {
  h.store.accounts = [account]
  h.store.watchedRepos = [repo]
  Object.assign(h.store, overrides)
}
function snapshot() {
  return (h.store.snapshots as Record<string, ReturnType<typeof pipe>[]>)['o/r'] ?? []
}

beforeEach(() => {
  for (const key of Object.keys(h.store)) {
    delete h.store[key]
  }
  vi.clearAllMocks()
  h.provider.validateToken.mockResolvedValue({ ok: true, user: 'u' })
  h.provider.listBranches.mockResolvedValue({
    branches: ['main'],
    etag: 'b',
    notModified: false,
    rateLimit: null
  })
  h.provider.listPipelines.mockResolvedValue(pipelines([]))
})

test('first sight seeds the snapshot silently (no notifications)', async () => {
  seed()
  h.provider.listPipelines.mockResolvedValue(pipelines([pipe('main', 'success', true)]))
  await poll()
  expect(snapshot().map((p) => p.ref)).toEqual(['main'])
  expect(h.notify.notifyMainFailed).not.toHaveBeenCalled()
  expect(h.notify.notifyRecovered).not.toHaveBeenCalled()
  expect(h.notify.setBadge).toHaveBeenCalledWith(0)
})

test('default-branch failure notifies loudly and sets the badge', async () => {
  seed({ snapshots: { 'o/r': [pipe('main', 'success', true)] } })
  h.provider.listPipelines.mockResolvedValue(pipelines([pipe('main', 'failed', true)]))
  await poll()
  expect(h.notify.notifyMainFailed).toHaveBeenCalledTimes(1)
  expect(h.notify.setBadge).toHaveBeenCalledWith(1)
})

test('recovery (failed → success) notifies', async () => {
  seed({ snapshots: { 'o/r': [pipe('main', 'failed', true)] } })
  h.provider.listPipelines.mockResolvedValue(pipelines([pipe('main', 'success', true)]))
  await poll()
  expect(h.notify.notifyRecovered).toHaveBeenCalledTimes(1)
})

test('ghost refs not in the live branch list are dropped', async () => {
  seed()
  h.provider.listBranches.mockResolvedValue({
    branches: ['main'],
    etag: 'b',
    notModified: false,
    rateLimit: null
  })
  h.provider.listPipelines.mockResolvedValue(
    pipelines([pipe('main', 'success', true), pipe('deleted-branch', 'success', false)])
  )
  await poll()
  expect(snapshot().map((p) => p.ref)).toEqual(['main'])
})

test('a rate limit pauses the account', async () => {
  seed()
  h.provider.listPipelines.mockRejectedValue(new RateLimitError(1_800_000_000))
  await poll()
  expect((h.store.rateLimitPausedUntil as Record<string, number>).a1).toBe(1_800_000_000)
})

test('overlapping poll() calls coalesce into a single cycle', async () => {
  seed()
  await Promise.all([poll(), poll()])
  expect(h.provider.listPipelines).toHaveBeenCalledTimes(1)
})

test('a paused account is skipped and keeps its snapshot', async () => {
  const future = Math.floor(Date.now() / 1000) + 600
  seed({
    rateLimitPausedUntil: { a1: future },
    snapshots: { 'o/r': [pipe('main', 'success', true)] }
  })
  await poll()
  expect(h.provider.listPipelines).not.toHaveBeenCalled()
  expect(snapshot().map((p) => p.ref)).toEqual(['main'])
})
