// Dev-only. When a surface runs in a plain browser tab (the dev-server URL), the real
// chrome.* APIs don't exist, so storage-driven UI can't render. This installs a minimal
// in-memory shim seeded with sample data so the surfaces preview at their localhost URL.
// Guarded by import.meta.env.DEV and a "is chrome already here?" check, so it never runs
// in the real extension and is tree-shaken out of production.

import type { Account, Pipeline, PipelineStatus, Repo } from '../providers/types'

function pipe(
  id: string,
  ref: string,
  status: PipelineStatus,
  isDefaultBranch: boolean,
  agoMinutes: number
): Pipeline {
  return {
    id,
    ref,
    isDefaultBranch,
    status,
    webUrl: 'https://example.test/run',
    sha: 'abc1234',
    title: `${ref} ${status}`,
    updatedAt: new Date(Date.now() - agoMinutes * 60_000).toISOString()
  }
}

function repo(name: string): Repo {
  return {
    id: name,
    accountId: 'gh',
    name,
    defaultBranch: 'main',
    webUrl: `https://example.test/${name}`
  }
}

function seedData() {
  const accounts: Account[] = [
    {
      id: 'gh',
      provider: 'github',
      label: 'personal',
      host: 'https://github.com',
      token: 'ghp_dev'
    }
  ]
  const watchedRepos = [
    repo('feedmypixel/marketing-site'),
    repo('feedmypixel/pixel-cli'),
    repo('feedmypixel/status-api'),
    repo('whiskyinvestdirect/api'),
    repo('whiskyinvestdirect/database')
  ]
  const snapshots: Record<string, Pipeline[]> = {
    'feedmypixel/marketing-site': [pipe('1', 'main', 'success', true, 90)],
    'feedmypixel/pixel-cli': [pipe('2', 'main', 'running', true, 1)],
    'feedmypixel/status-api': [
      pipe('3', 'main', 'failed', true, 4),
      pipe('4', 'pr/210-retry', 'failed', false, 9),
      pipe('5', 'fix/timeout', 'success', false, 120)
    ],
    'whiskyinvestdirect/api': [pipe('6', 'main', 'success', true, 40)],
    'whiskyinvestdirect/database': [pipe('7', 'main', 'failed', true, 30)]
  }
  return { accounts, watchedRepos, snapshots, settings: { pollMinutes: 1, notifyOnSuccess: true } }
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
        repos('feedmypixel/marketing-site'),
        repos('feedmypixel/pixel-cli'),
        repos('feedmypixel/status-api'),
        repos('acme-corp/billing'),
        repos('acme-corp/dashboard')
      ])
    }
    if (hasToken && /^https:\/\/api\.github\.com\/user(\?|$)/.test(url)) {
      return json({ login: 'feedmypixel' })
    }
    if (hasToken && /^https:\/\/gitlab\.com\/api\/v4\/projects/.test(url)) {
      return json([
        projects(1, 'whiskyinvestdirect/api'),
        projects(2, 'whiskyinvestdirect/database')
      ])
    }
    if (hasToken && /^https:\/\/gitlab\.com\/api\/v4\/user(\?|$)/.test(url)) {
      return json({ username: 'feedmypixel' })
    }
    return new Response('{"message":"Unauthorized"}', { status: 401 })
  }) as typeof fetch
}

if (import.meta.env.DEV && !(globalThis as { chrome?: { storage?: unknown } }).chrome?.storage) {
  install()
}

export {}
