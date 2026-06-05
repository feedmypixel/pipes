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

interface StorageShape {
  accounts: Account[]
  watchedRepos: Repo[]
  settings: Settings
  snapshots: Snapshots
  /** notificationId → web URL, so a click can open the right pipeline. */
  notifLinks: Record<string, string>
}

const DEFAULTS: StorageShape = {
  accounts: [],
  watchedRepos: [],
  settings: DEFAULT_SETTINGS,
  snapshots: {},
  notifLinks: {}
}

export async function get<K extends keyof StorageShape>(key: K): Promise<StorageShape[K]> {
  const result = await chrome.storage.local.get(key)
  return (result[key] ?? DEFAULTS[key]) as StorageShape[K]
}

export async function set<K extends keyof StorageShape>(
  key: K,
  value: StorageShape[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
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
