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
    listOpenChanges: vi.fn()
  },
  notify: {
    notifyMainFailed: vi.fn(),
    notifyChangeFailed: vi.fn(),
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
  },
  setMany: async (values: Record<string, unknown>) => Object.assign(h.store, values)
}))
vi.mock('../lib/notify', () => h.notify)
vi.mock('../providers', () => ({ getProvider: () => h.provider }))

const account = {
  id: 'a1',
  provider: 'github' as const,
  label: 'work',
  host: 'https://github.com',
  token: 't'
}
const repo = { id: 'o/r', accountId: 'a1', name: 'o/r', defaultBranch: 'main', webUrl: 'https://x' }

function defaultPipe(status: PipelineStatus) {
  return {
    id: `d-${status}`,
    ref: 'main',
    isDefaultBranch: true,
    status,
    webUrl: 'https://x/main',
    sha: 's',
    title: 'main',
    updatedAt: '2026-06-07T00:00:00Z'
  }
}
function prPipe(ref: string, status: PipelineStatus) {
  return {
    id: `${ref}-${status}`,
    ref,
    isDefaultBranch: false,
    status,
    webUrl: `https://x/${ref}`,
    sha: 's',
    title: ref,
    updatedAt: '2026-06-07T00:00:00Z'
  }
}
function runs(status?: PipelineStatus, extra: ReturnType<typeof prPipe>[] = []) {
  return {
    pipelines: [...(status ? [defaultPipe(status)] : []), ...extra],
    etag: 'e',
    notModified: false,
    rateLimit: null
  }
}
function change(number: number, status: PipelineStatus, isDraft = false) {
  return {
    number,
    title: `PR ${number}`,
    headRef: `f${number}`,
    headSha: `s${number}`,
    status,
    webUrl: `https://x/pull/${number}`,
    isDraft,
    isBot: false
  }
}
function openChanges(list: ReturnType<typeof change>[]) {
  return { changes: list, etag: 'c', notModified: false, rateLimit: null }
}
function seed(overrides: Record<string, unknown> = {}) {
  h.store.accounts = [account]
  h.store.watchedRepos = [repo]
  Object.assign(h.store, overrides)
}
function snap() {
  return (h.store.snapshots as Record<string, { default: unknown; changes: { number: number }[] }>)[
    'o/r'
  ]
}

beforeEach(() => {
  for (const key of Object.keys(h.store)) {
    delete h.store[key]
  }
  vi.clearAllMocks()
  h.provider.validateToken.mockResolvedValue({ ok: true, user: 'u' })
  h.provider.listPipelines.mockResolvedValue(runs())
  h.provider.listOpenChanges.mockResolvedValue(openChanges([]))
})

test('first sight seeds the default branch silently', async () => {
  seed()
  h.provider.listPipelines.mockResolvedValue(runs('success'))
  await poll()
  expect((snap().default as { status: string }).status).toBe('success')
  expect(h.notify.notifyMainFailed).not.toHaveBeenCalled()
  expect(h.notify.setBadge).toHaveBeenCalledWith(0)
})

test('default-branch failure notifies loudly and sets the badge', async () => {
  seed({ snapshots: { 'o/r': { default: defaultPipe('success'), changes: [] } } })
  h.provider.listPipelines.mockResolvedValue(runs('failed'))
  await poll()
  expect(h.notify.notifyMainFailed).toHaveBeenCalledTimes(1)
  expect(h.notify.setBadge).toHaveBeenCalledWith(1)
})

test('default-branch recovery notifies', async () => {
  seed({ snapshots: { 'o/r': { default: defaultPipe('failed'), changes: [] } } })
  h.provider.listPipelines.mockResolvedValue(runs('success'))
  await poll()
  expect(h.notify.notifyRecovered).toHaveBeenCalledTimes(1)
})

test('a PR check going failed notifies (status joined from runs by head ref)', async () => {
  seed({ snapshots: { 'o/r': { default: null, changes: [change(7, 'success')] } } })
  // PR #7's head branch is f7; a failed run on f7 flips it.
  h.provider.listPipelines.mockResolvedValue(runs(undefined, [prPipe('f7', 'failed')]))
  h.provider.listOpenChanges.mockResolvedValue(openChanges([change(7, 'success')]))
  await poll()
  expect(h.notify.notifyChangeFailed).toHaveBeenCalledTimes(1)
})

test('open PRs are stored in the snapshot', async () => {
  seed()
  h.provider.listOpenChanges.mockResolvedValue(openChanges([change(3, 'running')]))
  await poll()
  expect(snap().changes.map((c) => c.number)).toEqual([3])
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
    snapshots: { 'o/r': { default: defaultPipe('success'), changes: [] } }
  })
  await poll()
  expect(h.provider.listPipelines).not.toHaveBeenCalled()
  expect((snap().default as { status: string }).status).toBe('success')
})

test('a poll sends the stored ETags for both calls', async () => {
  seed({ repoEtags: { 'o/r': 'pipe-etag' }, changeEtags: { 'o/r': 'change-etag' } })
  await poll()
  expect(h.provider.listPipelines).toHaveBeenCalledWith(account, repo, 'pipe-etag')
  expect(h.provider.listOpenChanges).toHaveBeenCalledWith(account, repo, 'change-etag')
})

test('a PR row carries the joined pipeline updatedAt', async () => {
  seed()
  h.provider.listPipelines.mockResolvedValue(runs(undefined, [prPipe('f5', 'success')]))
  h.provider.listOpenChanges.mockResolvedValue(openChanges([change(5, 'success')]))
  await poll()
  const pr = (snap().changes as { number: number; updatedAt?: string }[]).find(
    (c) => c.number === 5
  )
  expect(pr?.updatedAt).toBe('2026-06-07T00:00:00Z')
})
