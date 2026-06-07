import { providerFor } from '../providers'
import { TERMINAL_STATUSES } from '../providers/types'
import type { Account, Change, Pipeline, PipelineStatus, Repo } from '../providers/types'
import { RateLimitError } from '../providers/http'
import * as storage from '../lib/storage'
import type { RepoSnapshot, Snapshots } from '../lib/storage'
import { mapLimit } from '../lib/async'
import { HEALTH_REFRESH_MS } from '../lib/config'
import * as notify from '../lib/notify'

/** Max provider requests in flight at once, so many repos don't burst the API. */
const POLL_CONCURRENCY = 6

type RateLimit = { remaining: number; reset: number }

/** The reading closer to exhaustion, so the budget floor sees the worst of a repo's calls. */
function worstRateLimit(a: RateLimit | null, b: RateLimit | null): RateLimit | null {
  if (!a) {
    return b
  }
  if (!b) {
    return a
  }
  return a.remaining <= b.remaining ? a : b
}

export type TransitionAction = 'fail' | 'recover' | null

/**
 * Pure decision: what (if anything) to announce, comparing a freshly fetched status against
 * what we last saw for the same thing (default branch, or a PR keyed by number).
 *
 * - First sight (prev undefined) seeds the baseline silently, so adding an already-red repo
 *   doesn't fire a notification storm.
 * - Only a *change* into a terminal state fires; re-polling the same failure stays quiet.
 * - Success only announces as a recovery from a previous failure.
 */
export function decideAction(
  prev: PipelineStatus | undefined,
  next: PipelineStatus,
  notifyOnSuccess: boolean
): TransitionAction {
  if (prev === undefined || prev === next) {
    return null
  }
  if (!TERMINAL_STATUSES.has(next)) {
    return null
  }
  if (next === 'failed') {
    return 'fail'
  }
  if (next === 'success' && notifyOnSuccess && prev === 'failed') {
    return 'recover'
  }
  return null
}

async function diffDefault(
  repo: Repo,
  prev: Pipeline | null,
  next: Pipeline,
  notifyOnSuccess: boolean
): Promise<void> {
  switch (decideAction(prev?.status, next.status, notifyOnSuccess)) {
    case 'fail':
      return notify.notifyMainFailed({ repo, pipeline: next })
    case 'recover':
      return notify.notifyRecovered({
        repo,
        key: 'default',
        label: repo.defaultBranch,
        url: next.webUrl
      })
  }
}

async function diffChange(
  repo: Repo,
  prev: Change | undefined,
  next: Change,
  notifyOnSuccess: boolean
): Promise<void> {
  switch (decideAction(prev?.status, next.status, notifyOnSuccess)) {
    case 'fail':
      return notify.notifyChangeFailed({ repo, change: next })
    case 'recover':
      return notify.notifyRecovered({
        repo,
        key: `pr-${next.number}`,
        label: `#${next.number}`,
        url: next.webUrl
      })
  }
}

interface RepoPollResult {
  snapshot: RepoSnapshot
  etag: string | null
  changeEtag: string | null
  rateLimit: RateLimit | null
  /** Epoch seconds to pause this account, when the provider rate-limited us. */
  pausedUntil?: number
}

const EMPTY_SNAPSHOT: RepoSnapshot = { default: null, changes: [] }

/**
 * Fetch + diff one repo: the default-branch run (the headline) plus its open PRs/MRs with head
 * status. Sends prior ETags for conditional requests; a 304 keeps the cached side. Any error
 * keeps the old snapshot. `fresh` skips the ETags so an open panel gets live status.
 */
async function pollRepo(
  account: Account,
  repo: Repo,
  prevSnapshots: Snapshots,
  notifyOnSuccess: boolean,
  etag: string | undefined,
  changeEtag: string | undefined,
  fresh: boolean
): Promise<RepoPollResult> {
  const prev = prevSnapshots[repo.id] ?? EMPTY_SNAPSHOT
  try {
    const provider = providerFor(account)

    const runs = await provider.listPipelines(account, repo, fresh ? undefined : etag)
    const nextDefault = runs.notModified
      ? prev.default
      : (runs.pipelines.find((pipeline) => pipeline.isDefaultBranch) ?? null)

    const open = await provider.listOpenChanges(account, repo, fresh ? undefined : changeEtag)
    const nextChanges = open.notModified ? prev.changes : open.changes

    // Pause off whichever call is closer to the budget floor, so neither fetch is invisible.
    const rateLimit = worstRateLimit(runs.rateLimit, open.rateLimit)

    if (!runs.notModified && nextDefault) {
      await diffDefault(repo, prev.default, nextDefault, notifyOnSuccess)
    }
    if (!open.notModified) {
      const prevByNumber = new Map(prev.changes.map((change) => [change.number, change]))
      for (const change of nextChanges) {
        await diffChange(repo, prevByNumber.get(change.number), change, notifyOnSuccess)
      }
    }
    return {
      snapshot: { default: nextDefault, changes: nextChanges },
      etag: runs.etag,
      changeEtag: open.etag,
      rateLimit
    }
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        snapshot: prev,
        etag: etag ?? null,
        changeEtag: changeEtag ?? null,
        rateLimit: null,
        pausedUntil: err.resetAt
      }
    }
    console.warn(`Poll failed for ${repo.name}:`, (err as Error).message)
    return { snapshot: prev, etag: etag ?? null, changeEtag: changeEtag ?? null, rateLimit: null }
  }
}

/**
 * Badge count = default branches currently failing. Matches the "X failing on main"
 * headline, so a green set of default branches clears the badge even when PRs are red.
 */
function countFailures(snapshots: Snapshots): number {
  let count = 0
  for (const snapshot of Object.values(snapshots)) {
    if (snapshot.default?.status === 'failed') {
      count++
    }
  }
  return count
}

/** Pause a connection's polling when its remaining rate-limit budget drops below this. */
const RATE_LIMIT_FLOOR = 50

// Single-flight: overlapping triggers (alarm + poll-now + startup) coalesce onto one cycle
// so they can't race on chrome.storage.
let inFlight: Promise<void> | null = null

/**
 * `force` (manual Refresh) bypasses the health throttle for an immediate re-check.
 * `fresh` skips the ETags so GitHub can't answer a stale 304 — an open panel polls fresh
 * for real-time status; the background alarm keeps the ETags (rate-safe).
 */
export function poll(force = false, fresh = false): Promise<void> {
  if (inFlight) {
    return inFlight
  }
  inFlight = runPollCycle(force, fresh).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function runPollCycle(force: boolean, fresh: boolean): Promise<void> {
  const [
    accounts,
    watchedRepos,
    settings,
    prevSnapshots,
    repoEtags,
    changeEtags,
    pausedUntil,
    prevHealth,
    lastHealthAt
  ] = await Promise.all([
    storage.get('accounts'),
    storage.get('watchedRepos'),
    storage.get('settings'),
    storage.get('snapshots'),
    storage.get('repoEtags'),
    storage.get('changeEtags'),
    storage.get('rateLimitPausedUntil'),
    storage.get('accountHealth'),
    storage.get('lastHealthAt')
  ])
  if (accounts.length === 0) {
    await storage.set('accountHealth', {})
    await notify.setBadge(0)
    await storage.set('lastPolledAt', Date.now())
    return
  }

  // Connection health: surface invalid/expired tokens. Tokens change rarely, so re-validate at
  // most every HEALTH_REFRESH_MS; otherwise reuse the last result. A rate-limit here is not a
  // token problem — record the pause and leave the connection healthy.
  const healthPaused: Record<string, number> = {}
  let health = prevHealth
  if (force || Date.now() - lastHealthAt >= HEALTH_REFRESH_MS) {
    health = {}
    await Promise.all(
      accounts.map(async (account) => {
        try {
          const result = await providerFor(account).validateToken(account)
          health[account.id] = result.ok ? { ok: true } : { ok: false, error: result.error }
        } catch (err) {
          if (err instanceof RateLimitError) {
            healthPaused[account.id] = err.resetAt
            health[account.id] = { ok: true }
          } else {
            health[account.id] = { ok: false, error: (err as Error).message }
          }
        }
      })
    )
    await storage.set('accountHealth', health)
    await storage.set('lastHealthAt', Date.now())
  }

  if (watchedRepos.length === 0) {
    await notify.setBadge(0)
    await storage.set('lastPolledAt', Date.now())
    return
  }

  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const now = Math.floor(Date.now() / 1000)

  const results = await mapLimit(watchedRepos, POLL_CONCURRENCY, async (repo) => {
    const account = accountById.get(repo.accountId)
    const keep = prevSnapshots[repo.id] ?? EMPTY_SNAPSHOT
    const accountPaused = account
      ? Math.max(pausedUntil[account.id] ?? 0, healthPaused[account.id] ?? 0)
      : 0
    const accountUnhealthy = account ? health[account.id]?.ok === false : true
    // Skip repos whose account is missing, known-bad, or paused — keep the last snapshot.
    if (!account || accountUnhealthy || accountPaused > now) {
      return {
        repo,
        account,
        snapshot: keep,
        etag: repoEtags[repo.id] ?? null,
        changeEtag: changeEtags[repo.id] ?? null,
        rateLimit: null,
        pausedUntil: undefined
      }
    }
    const result = await pollRepo(
      account,
      repo,
      prevSnapshots,
      settings.notifyOnSuccess,
      repoEtags[repo.id],
      changeEtags[repo.id],
      fresh
    )
    return { repo, account, ...result }
  })

  const snapshots: Snapshots = {}
  const nextEtags: Record<string, string> = {}
  const nextChangeEtags: Record<string, string> = {}
  const nextPaused: Record<string, number> = { ...pausedUntil }
  const pause = (accountId: string, until: number) => {
    nextPaused[accountId] = Math.max(nextPaused[accountId] ?? 0, until)
  }
  for (const [accountId, until] of Object.entries(healthPaused)) {
    pause(accountId, until)
  }
  for (const {
    repo,
    account,
    snapshot,
    etag,
    changeEtag,
    rateLimit,
    pausedUntil: repoPaused
  } of results) {
    snapshots[repo.id] = snapshot
    if (etag) {
      nextEtags[repo.id] = etag
    }
    if (changeEtag) {
      nextChangeEtags[repo.id] = changeEtag
    }
    if (account && repoPaused) {
      pause(account.id, repoPaused)
    }
    if (account && rateLimit && rateLimit.remaining < RATE_LIMIT_FLOOR) {
      pause(account.id, rateLimit.reset)
    }
  }
  // Drop expired pauses so the store doesn't accrete stale entries.
  const prunedPaused = Object.fromEntries(
    Object.entries(nextPaused).filter(([, until]) => until > now)
  )

  await storage.set('snapshots', snapshots)
  await storage.set('repoEtags', nextEtags)
  await storage.set('changeEtags', nextChangeEtags)
  await storage.set('rateLimitPausedUntil', prunedPaused)
  await storage.set('lastPolledAt', Date.now())
  await notify.setBadge(countFailures(snapshots))
}
