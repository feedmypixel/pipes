// Dev-only. When a surface runs in a plain browser tab (the dev-server URL), the real
// chrome.* APIs don't exist, so storage-driven UI can't render. This installs a minimal
// in-memory shim seeded with sample data so the surfaces preview at their localhost URL.
// Guarded by import.meta.env.DEV and a "is chrome already here?" check, so it never runs
// in the real extension and is tree-shaken out of production.

import type { Account, Author, Change, Pipeline, PipelineStatus, Repo } from '../providers/types'
import type { RepoSnapshot } from './storage'

const dicebear = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/png?seed=${seed}`

const A = {
  me: {
    login: 'octo-org',
    name: 'Octo Org',
    avatarUrl: dicebear('identicon', 'octo-org-7'),
    profileUrl: 'https://example.test/octo-org'
  },
  ada: {
    login: 'ada',
    name: 'Ada Lovelace',
    avatarUrl: dicebear('identicon', 'ada-3'),
    profileUrl: 'https://example.test/ada'
  },
  grace: {
    login: 'grace',
    name: 'Grace Hopper',
    avatarUrl: dicebear('identicon', 'grace-9'),
    profileUrl: 'https://example.test/grace'
  },
  linus: {
    login: 'linus',
    name: 'Linus Torvalds',
    avatarUrl: dicebear('identicon', 'linus-2'),
    profileUrl: 'https://example.test/linus'
  },
  pat: { login: 'pat', name: 'Pat Lee', profileUrl: 'https://example.test/pat' },
  bot: {
    login: 'dependabot[bot]',
    name: 'Dependabot',
    avatarUrl: dicebear('bottts', 'dependabot-5'),
    profileUrl: 'https://example.test/dependabot'
  }
} satisfies Record<string, Author>

function pipe(
  id: string,
  ref: string,
  status: PipelineStatus,
  isDefaultBranch: boolean,
  agoMinutes: number,
  attribution?: Author
): Pipeline {
  return {
    id,
    ref,
    isDefaultBranch,
    status,
    webUrl: 'https://example.test/run',
    sha: 'abc1234',
    title: `${ref} ${status}`,
    updatedAt: new Date(Date.now() - agoMinutes * 60_000).toISOString(),
    attribution
  }
}

function repo(name: string, accountId = 'gh'): Repo {
  return {
    id: name,
    accountId,
    name,
    defaultBranch: 'main',
    webUrl: `https://example.test/${name}`
  }
}

function change(
  number: number,
  title: string,
  headRef: string,
  status: PipelineStatus,
  agoMinutes: number,
  isDraft = false,
  attribution: Author = A.me
): Change {
  return {
    number,
    title,
    headRef,
    headSha: 'abc1234',
    status,
    updatedAt: new Date(Date.now() - agoMinutes * 60_000).toISOString(),
    webUrl: `https://example.test/pull/${number}`,
    isDraft,
    isBot: attribution.login.endsWith('[bot]'),
    attribution
  }
}

function seedData() {
  const accounts: Account[] = [
    {
      id: 'gh',
      provider: 'github',
      label: 'feedMyPixel',
      host: 'https://github.com',
      token: 'ghp_dev'
    },
    { id: 'gl', provider: 'gitlab', label: 'Work', host: 'https://gitlab.com', token: 'glpat_dev' }
  ]
  const watchedRepos = [
    repo('feedmypixel/pipes'),
    repo('feedmypixel/stat-api'),
    repo('feedmypixel/stat-ui'),
    repo('whiskyinvestdirect/api', 'gl'),
    repo('whiskyinvestdirect/database', 'gl'),
    repo('whiskyinvestdirect/web', 'gl')
  ]
  const snapshots: Record<string, RepoSnapshot> = {
    'feedmypixel/pipes': {
      default: pipe('1', 'main', 'failed', true, 4, A.grace),
      changes: [
        change(212, 'Author attribution on rows', 'feat/attribution', 'running', 2, false, A.me),
        change(210, 'Retry flaky integration test', 'pr/210-retry', 'failed', 9, false, A.ada),
        change(205, 'WIP: caching layer', 'feat/cache', 'pending', 40, true, A.bot)
      ]
    },
    'feedmypixel/stat-api': {
      default: pipe('2', 'main', 'success', true, 70, A.me),
      changes: [change(88, 'Bump request timeout', 'fix/timeout', 'success', 120, false, A.pat)]
    },
    'feedmypixel/stat-ui': { default: pipe('3', 'main', 'running', true, 1, A.me), changes: [] },
    'whiskyinvestdirect/api': {
      default: pipe('4', 'main', 'success', true, 30, A.grace),
      changes: [change(64, 'Balance mapper test', 'wid-464-balance', 'running', 3, false, A.me)]
    },
    'whiskyinvestdirect/database': {
      default: pipe('5', 'main', 'failed', true, 21, A.linus),
      changes: [change(24, 'Enforce email uniqueness', 'wid-409', 'failed', 200, false, A.me)]
    },
    'whiskyinvestdirect/web': {
      default: pipe('6', 'main', 'success', true, 90, A.ada),
      changes: []
    }
  }
  const accountHealth = {
    gh: { ok: true, user: 'octo-org' },
    gl: { ok: true, user: 'octo-org' }
  }
  return {
    accounts,
    watchedRepos,
    snapshots,
    accountHealth,
    settings: { pollMinutes: 1, notifyOnSuccess: true }
  }
}

type Listener = (
  changes: Record<string, { oldValue: unknown; newValue: unknown }>,
  area: string
) => void

function install() {
  const store: Record<string, unknown> = seedData()
  const listeners = new Set<Listener>()
  const log = (label: string) => () => console.info(`[dev-chrome] ${label}`)

  const shim = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => {
          const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {}
          for (const key of Object.keys(items)) {
            changes[key] = { oldValue: store[key], newValue: items[key] }
            store[key] = items[key]
          }
          listeners.forEach((listener) => listener(changes, 'local'))
        }
      },
      onChanged: {
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener)
      }
    },
    runtime: {
      sendMessage: async () => undefined,
      openOptionsPage: log('openOptionsPage'),
      onMessage: { addListener: () => {}, removeListener: () => {} }
    },
    windows: { getCurrent: async () => ({ id: 1 }) },
    sidePanel: { open: log('sidePanel.open') },
    tabs: { create: async ({ url }: { url: string }) => window.open(url, '_blank') },
    permissions: { request: async () => true }
  }

  ;(globalThis as { chrome?: unknown }).chrome = shim
  mockFetch()
}

// Mock the provider endpoints so validate + the repo picker work in a tab preview.
function mockFetch() {
  const json = (data: unknown) =>
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  const repos = (full: string) => ({
    full_name: full,
    default_branch: 'main',
    html_url: `https://github.com/${full}`
  })
  const projects = (id: number, path: string) => ({
    id,
    path_with_namespace: path,
    default_branch: 'main',
    web_url: `https://gitlab.com/${path}`
  })

  // Only the real SaaS hosts succeed, and only with a token header — so a garbage host
  // or empty token fails just like the real API would.
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const headers = new Headers(init?.headers)
    const hasToken = Boolean(headers.get('authorization') || headers.get('private-token'))
    if (hasToken && /^https:\/\/api\.github\.com\/user\/repos/.test(url)) {
      return json([
        repos('feedmypixel/pipes'),
        repos('feedmypixel/stat-api'),
        repos('feedmypixel/stat-ui'),
        repos('feedmypixel/website')
      ])
    }
    if (hasToken && /^https:\/\/api\.github\.com\/user(\?|$)/.test(url)) {
      return json({ login: 'octo-org' })
    }
    if (hasToken && /^https:\/\/gitlab\.com\/api\/v4\/projects/.test(url)) {
      return json([
        projects(1, 'whiskyinvestdirect/api'),
        projects(2, 'whiskyinvestdirect/database'),
        projects(3, 'whiskyinvestdirect/web')
      ])
    }
    if (hasToken && /^https:\/\/gitlab\.com\/api\/v4\/user(\?|$)/.test(url)) {
      return json({ username: 'octo-org' })
    }
    return new Response('{"message":"Unauthorized"}', { status: 401 })
  }) as typeof fetch
}

if (import.meta.env.DEV && !(globalThis as { chrome?: { storage?: unknown } }).chrome?.storage) {
  install()
}

export {}
