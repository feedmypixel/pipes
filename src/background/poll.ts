import { providerFor } from '../providers'
import { TERMINAL_STATUSES } from '../providers/types'
import type { Account, Pipeline, Repo } from '../providers/types'
import { RateLimitError } from '../providers/http'
import * as storage from '../lib/storage'
import type { Snapshots } from '../lib/storage'
import { mapLimit } from '../lib/async'
import { keepLiveBranches } from '../lib/group'
import { HEALTH_REFRESH_MS, BRANCH_REFRESH_MS } from '../lib/config'
import * as notify from '../lib/notify'

/** Max provider requests in flight at once, so many repos don't burst the API. */
const POLL_CONCURRENCY = 6

/** Build a fast lookup of a snapshot's pipelines by ref. */
function byRef(pipelines: Pipeline[]): Map<string, Pipeline> {
  return new Map(pipelines.map((p) => [p.ref, p]))
}

export type TransitionAction = 'main-fail' | 'branch-fail' | 'recover' | null

/**
 * Pure decision: what (if anything) to announce for one ref, comparing the
 * freshly fetched pipeline against what we last saw.
 *
 * - First sight (no prev) seeds the baseline silently, so adding a repo whose
 *   pipelines are already red doesn't fire a notification storm.
 * - Only a *change* into a terminal state fires; re-polling the same failure
 *   stays quiet.
 * - Success only announces as a recovery from a previous failure.
 */
export function decideAction(
  prev: Pipeline | undefined,
  next: Pipeline,
  notifyOnSuccess: boolean
): TransitionAction {
  if (!prev || prev.status === next.status) {
    return null
  }
  if (!TERMINAL_STATUSES.has(next.status)) {
    return null
  }
  if (next.status === 'failed') {
    return next.isDefaultBranch ? 'main-fail' : 'branch-fail'
  }
  if (next.status === 'success' && notifyOnSuccess && prev.status === 'failed') {
    return 'recover'
  }
  return null
}

async function announceTransition(
  repo: Repo,
  prev: Pipeline | undefined,
  next: Pipeline,
  notifyOnSuccess: boolean
): Promise<void> {
  switch (decideAction(prev, next, notifyOnSuccess)) {
    case 'main-fail':
      return notify.notifyMainFailed({ repo, pipeline: next })
    case 'branch-fail':
      return notify.notifyBranchFailed({ repo, pipeline: next })
    case 'recover':
      return notify.notifyRecovered({ repo, pipeline: next })
  }
}

interface BranchCacheEntry {
  names: string[]
  etag: string
  checkedAt: number
  /** /branches couldn't be read (e.g. token lacks Contents:read) — don't filter, don't hammer. */
  unavailable?: boolean
}

interface RepoPollResult {
  pipelines: Pipeline[]
  etag: string | null
  rateLimit: { remaining: number; reset: number } | null
  /** Epoch seconds to pause this account, when the provider rate-limited us. */
  pausedUntil?: number
  /** Live-branch cache to persist for this repo (omitted when unchanged/unavailable). */
  branches?: BranchCacheEntry
}

/**
 * Fetch + diff one repo: latest run per ref, intersected with the repo's live branches so
 * merged/deleted-branch ghosts drop out. Sends prior ETags for conditional requests; a 304
 * keeps the cached data. Any error keeps the old snapshot.
 */
async function pollRepo(
  account: Account,
  repo: Repo,
  prevSnapshots: Snapshots,
  notifyOnSuccess: boolean,
  etag: string | undefined,
  branchCache: BranchCacheEntry | undefined,
  force: boolean
): Promise<RepoPollResult> {
  const prevList = prevSnapshots[repo.id] ?? []
  try {
    const provider = providerFor(account)

    // Live branches drop ghost refs. Refreshed only every BRANCH_REFRESH_MS (branch lists
    // change slowly) — between refreshes we reuse the cache. Best-effort: if /branches can't be
    // read (e.g. a GitHub Actions-only token lacking Contents:read) we mark it unavailable, skip
    // filtering rather than losing the repo, and don't retry every poll. Rate limits propagate.
    const now = Date.now()
    let branches: BranchCacheEntry | undefined = branchCache
    let liveSet: Set<string> | null =
      branchCache && !branchCache.unavailable ? new Set(branchCache.names) : null

    const branchesStale = force || !branchCache || now - branchCache.checkedAt > BRANCH_REFRESH_MS
    if (branchesStale) {
      try {
        const branchResult = await provider.listBranches(account, repo, branchCache?.etag)
        const liveNames = branchResult.notModified
          ? (branchCache?.names ?? [])
          : branchResult.branches
        liveSet = new Set(liveNames)
        branches = {
          names: liveNames,
          etag: branchResult.etag ?? branchCache?.etag ?? '',
          checkedAt: now
        }
      } catch (err) {
        if (err instanceof RateLimitError) {
          throw err
        }
        console.warn(`Branches unavailable for ${repo.name}:`, (err as Error).message)
        liveSet = null // don't filter — show all rather than hide the repo
        branches = { names: [], etag: '', checkedAt: now, unavailable: true }
      }
    }
    const filterLive = (pipelines: Pipeline[]): Pipeline[] =>
      liveSet ? keepLiveBranches(pipelines, liveSet) : pipelines

    const result = await provider.listPipelines(account, repo, etag)
    if (result.notModified) {
      // Pipelines unchanged; re-filter the cached snapshot in case branches changed.
      return {
        pipelines: filterLive(prevList),
        etag: result.etag,
        rateLimit: result.rateLimit,
        branches
      }
    }
    const live = filterLive(result.pipelines)
    const prev = byRef(prevList)
    for (const pipeline of live) {
      await announceTransition(repo, prev.get(pipeline.ref), pipeline, notifyOnSuccess)
    }
    return { pipelines: live, etag: result.etag, rateLimit: result.rateLimit, branches }
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { pipelines: prevList, etag: etag ?? null, rateLimit: null, pausedUntil: err.resetAt }
    }
    console.warn(`Poll failed for ${repo.name}:`, (err as Error).message)
    return { pipelines: prevList, etag: etag ?? null, rateLimit: null }
  }
}

/**
 * Badge count = default branches currently failing. Matches the "X failing on main"
 * headline, so a green set of default branches clears the badge even when feature
 * branches are red.
 */
function countFailures(snapshots: Snapshots): number {
  let count = 0
  for (const pipelines of Object.values(snapshots)) {
    if (pipelines.some((p) => p.isDefaultBranch && p.status === 'failed')) {
      count++
    }
  }
  return count
}

/**
 * One full poll cycle: every watched repo, in parallel, diffed and announced.
 * Writes fresh snapshots (which the UIs subscribe to) and updates the badge.
 */
/** Pause a connection's polling when its remaining rate-limit budget drops below this. */
const RATE_LIMIT_FLOOR = 50

// Single-flight: overlapping triggers (alarm + poll-now + startup) coalesce onto one cycle
// so they can't race on chrome.storage.
let inFlight: Promise<void> | null = null

/** `force` (manual Refresh) bypasses the health + branch throttles for an immediate full check. */
export function poll(force = false): Promise<void> {
  if (inFlight) {
    return inFlight
  }
  inFlight = runPollCycle(force).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function runPollCycle(force: boolean): Promise<void> {
  const [
    accounts,
    watchedRepos,
    settings,
    prevSnapshots,
    repoEtags,
    pausedUntil,
    branchCache,
    prevHealth,
    lastHealthAt
  ] = await Promise.all([
    storage.get('accounts'),
    storage.get('watchedRepos'),
    storage.get('settings'),
    storage.get('snapshots'),
    storage.get('repoEtags'),
    storage.get('rateLimitPausedUntil'),
    storage.get('branchCache'),
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
    const keep = prevSnapshots[repo.id] ?? []
    const accountPaused = account
      ? Math.max(pausedUntil[account.id] ?? 0, healthPaused[account.id] ?? 0)
      : 0
    const accountUnhealthy = account ? health[account.id]?.ok === false : true
    // Skip repos whose account is missing, known-bad, or paused — keep the last snapshot.
    if (!account || accountUnhealthy || accountPaused > now) {
      return {
        repo,
        account,
        pipelines: keep,
        etag: repoEtags[repo.id] ?? null,
        rateLimit: null,
        pausedUntil: undefined,
        branches: branchCache[repo.id]
      }
    }
    const result = await pollRepo(
      account,
      repo,
      prevSnapshots,
      settings.notifyOnSuccess,
      repoEtags[repo.id],
      branchCache[repo.id],
      force
    )
    return { repo, account, ...result }
  })

  const snapshots: Snapshots = {}
  const nextEtags: Record<string, string> = {}
  const nextBranchCache: Record<string, BranchCacheEntry> = {}
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
    pipelines,
    etag,
    rateLimit,
    pausedUntil: repoPaused,
    branches
  } of results) {
    snapshots[repo.id] = pipelines
    if (etag) {
      nextEtags[repo.id] = etag
    }
    if (branches) {
      nextBranchCache[repo.id] = branches
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
  await storage.set('branchCache', nextBranchCache)
  await storage.set('rateLimitPausedUntil', prunedPaused)
  await storage.set('lastPolledAt', Date.now())
  await notify.setBadge(countFailures(snapshots))
}
