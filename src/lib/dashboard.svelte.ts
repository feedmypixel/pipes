import * as storage from './storage'
import type { Snapshots, AccountHealth } from './storage'
import type { Account, Repo } from '../providers/types'
import { countDefaultBranchFailures } from './group'
import { holdLivePort } from './live-port'
import browser from './browser'

/**
 * Shared dashboard state for the popup + side panel: mirrors the chrome.storage keys both
 * surfaces read, derives the alert inputs, and exposes a manual refresh. Call once in a
 * component's script — it wires the storage subscriptions + live port to that component's
 * lifecycle. Each surface still owns its own view (filtering, search, layout).
 */
export function useDashboard() {
  let accounts = $state<Account[]>([])
  let watchedRepos = $state<Repo[]>([])
  let snapshots = $state<Snapshots>({})
  let accountHealth = $state<Record<string, AccountHealth>>({})
  let rateLimitPaused = $state<Record<string, number>>({})
  let lastPolledAt = $state(0)
  let refreshing = $state(false)

  $effect(() => {
    storage.get('accounts').then((value) => (accounts = value))
    storage.get('watchedRepos').then((value) => (watchedRepos = value))
    storage.get('snapshots').then((value) => (snapshots = value))
    storage.get('accountHealth').then((value) => (accountHealth = value))
    storage.get('rateLimitPausedUntil').then((value) => (rateLimitPaused = value))
    storage.get('lastPolledAt').then((value) => (lastPolledAt = value))
    const unsubscribers = [
      storage.subscribe('accounts', (value) => (accounts = value)),
      storage.subscribe('watchedRepos', (value) => (watchedRepos = value)),
      storage.subscribe('snapshots', (value) => (snapshots = value)),
      storage.subscribe('accountHealth', (value) => (accountHealth = value)),
      storage.subscribe('rateLimitPausedUntil', (value) => (rateLimitPaused = value)),
      storage.subscribe('lastPolledAt', (value) => (lastPolledAt = value))
    ]
    return () => unsubscribers.forEach((off) => off())
  })

  // Hold a live port while the surface is open so the worker drives a fast fresh poll loop. A
  // panel-side setInterval gets throttled to ~1/min when the document is backgrounded; the
  // worker's timer doesn't. The worker stays the single owner of notifications + the badge.
  $effect(holdLivePort)

  const mainFailing = $derived(countDefaultBranchFailures(watchedRepos, snapshots))
  const configured = $derived(accounts.length > 0)
  // accountId → authenticated login, for the "mine" scope filter.
  const viewerLogins = $derived(
    Object.fromEntries(
      accounts.flatMap((account) => {
        const user = accountHealth[account.id]?.user
        return user ? [[account.id, user]] : []
      })
    )
  )
  const connectionIssues = $derived(
    accounts
      .filter((account) => accountHealth[account.id] && !accountHealth[account.id].ok)
      .map((account) => ({
        id: account.id,
        label: account.label,
        error: accountHealth[account.id].error
      }))
  )
  const rateLimited = $derived(
    accounts
      .filter((account) => (rateLimitPaused[account.id] ?? 0) > Math.floor(Date.now() / 1000))
      .map((account) => ({
        id: account.id,
        label: account.label,
        resumesAt: rateLimitPaused[account.id]
      }))
  )

  async function refresh() {
    refreshing = true
    try {
      await browser.runtime.sendMessage({ type: 'poll-now', force: true })
    } finally {
      refreshing = false
    }
  }

  return {
    get accounts() {
      return accounts
    },
    get watchedRepos() {
      return watchedRepos
    },
    get snapshots() {
      return snapshots
    },
    get viewerLogins() {
      return viewerLogins
    },
    get lastPolledAt() {
      return lastPolledAt
    },
    get refreshing() {
      return refreshing
    },
    get mainFailing() {
      return mainFailing
    },
    get configured() {
      return configured
    },
    get connectionIssues() {
      return connectionIssues
    },
    get rateLimited() {
      return rateLimited
    },
    refresh
  }
}
