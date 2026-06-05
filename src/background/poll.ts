import { providerFor } from '../providers'
import { TERMINAL_STATUSES } from '../providers/types'
import type { Account, Pipeline, Repo } from '../providers/types'
import * as storage from '../lib/storage'
import type { Snapshots } from '../lib/storage'
import * as notify from '../lib/notify'

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

/** Fetch + diff one repo, returning its new snapshot (or the old one on error). */
async function pollRepo(
  account: Account,
  repo: Repo,
  prevSnapshots: Snapshots,
  notifyOnSuccess: boolean
): Promise<Pipeline[]> {
  const prev = byRef(prevSnapshots[repo.id] ?? [])
  let next: Pipeline[]
  try {
    next = await providerFor(account).listPipelines(account, repo)
  } catch (err) {
    console.warn(`Poll failed for ${repo.name}:`, (err as Error).message)
    return prevSnapshots[repo.id] ?? []
  }

  for (const pipeline of next) {
    await announceTransition(repo, prev.get(pipeline.ref), pipeline, notifyOnSuccess)
  }
  return next
}

/** Count refs currently in a failed state across all snapshots. */
function countFailures(snapshots: Snapshots): number {
  let count = 0
  for (const pipelines of Object.values(snapshots)) {
    count += pipelines.filter((p) => p.status === 'failed').length
  }
  return count
}

/**
 * One full poll cycle: every watched repo, in parallel, diffed and announced.
 * Writes fresh snapshots (which the UIs subscribe to) and updates the badge.
 */
export async function poll(): Promise<void> {
  const [accounts, watchedRepos, settings, prevSnapshots] = await Promise.all([
    storage.get('accounts'),
    storage.get('watchedRepos'),
    storage.get('settings'),
    storage.get('snapshots')
  ])
  if (accounts.length === 0 || watchedRepos.length === 0) {
    return
  }

  const accountById = new Map(accounts.map((a) => [a.id, a]))

  const results = await Promise.all(
    watchedRepos.map(async (repo) => {
      const account = accountById.get(repo.accountId)
      if (!account) {
        return [repo.id, prevSnapshots[repo.id] ?? []] as const
      }
      const pipelines = await pollRepo(account, repo, prevSnapshots, settings.notifyOnSuccess)
      return [repo.id, pipelines] as const
    })
  )

  const snapshots: Snapshots = Object.fromEntries(results)
  await storage.set('snapshots', snapshots)
  await notify.setBadge(countFailures(snapshots))
}
