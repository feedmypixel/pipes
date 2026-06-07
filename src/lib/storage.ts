import type { Account, Pipeline, Repo } from '../providers/types'

export interface Settings {
  /** Poll interval in minutes. Chrome enforces a 0.5 minimum on alarms. */
  pollMinutes: number
  /** Notify when a previously-broken pipeline goes green again. */
  notifyOnSuccess: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  pollMinutes: 1,
  notifyOnSuccess: true
}

/** Latest pipeline per ref, keyed by repo id. The single source for UI + diffing. */
export type Snapshots = Record<string, Pipeline[]>

/** Per-connection reachability/auth, refreshed each poll. Drives the issue banner. */
export interface AccountHealth {
  ok: boolean
  /** Why it failed, when not ok (e.g. token invalid or host unreachable). */
  error?: string
}

interface StorageShape {
  accounts: Account[]
  watchedRepos: Repo[]
  /** Repos a connection can see, cached per accountId so the picker renders without refetching. */
  availableRepos: Record<string, Repo[]>
  settings: Settings
  snapshots: Snapshots
  /** ETag per repo id, for conditional poll requests (304s don't cost rate-limit budget). */
  repoEtags: Record<string, string>
  /** accountId → epoch seconds to resume polling after a rate-limit back-off. */
  rateLimitPausedUntil: Record<string, number>
  /** notificationId → web URL, so a click can open the right pipeline. */
  notifLinks: Record<string, string>
  /** Epoch ms of the last completed poll cycle, for the "updated … ago" footer. */
  lastPolledAt: number
  /** Connection health per accountId, refreshed each poll. */
  accountHealth: Record<string, AccountHealth>
  /** Live branch names + ETag per repo id, to drop ghost (deleted-branch) refs. */
  branchCache: Record<string, { names: string[]; etag: string }>
}

const DEFAULTS: StorageShape = {
  accounts: [],
  watchedRepos: [],
  availableRepos: {},
  settings: DEFAULT_SETTINGS,
  snapshots: {},
  repoEtags: {},
  rateLimitPausedUntil: {},
  notifLinks: {},
  lastPolledAt: 0,
  accountHealth: {},
  branchCache: {}
}

/**
 * A stored value is usable only if it matches the default's shape (array vs object
 * vs primitive). Guards against a corrupt/legacy value bricking the app — e.g. a
 * non-array `accounts` would throw on `.map`/spread everywhere. Wrong type → default.
 */
function matchesShape(value: unknown, fallback: unknown): boolean {
  if (Array.isArray(fallback)) {
    return Array.isArray(value)
  }
  if (fallback !== null && typeof fallback === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
  }
  return typeof value === typeof fallback
}

export async function get<K extends keyof StorageShape>(key: K): Promise<StorageShape[K]> {
  const result = await chrome.storage.local.get(key)
  const value = result[key]
  return (matchesShape(value, DEFAULTS[key]) ? value : DEFAULTS[key]) as StorageShape[K]
}

export async function set<K extends keyof StorageShape>(
  key: K,
  value: StorageShape[K]
): Promise<void> {
  // Callers pass Svelte $state, which is a Proxy. chrome.storage serializes via
  // structured clone, which throws on a Proxy — strip to a plain value first.
  // Our stored shapes are all JSON-safe, so a JSON round-trip does it.
  await chrome.storage.local.set({ [key]: JSON.parse(JSON.stringify(value)) })
}

/**
 * Subscribe to changes for one key. Returns an unsubscribe fn.
 * Used by Svelte UIs to live-update when the poll loop writes new snapshots.
 */
export function subscribe<K extends keyof StorageShape>(
  key: K,
  callback: (value: StorageShape[K]) => void
): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && key in changes) {
      callback((changes[key].newValue ?? DEFAULTS[key]) as StorageShape[K])
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
