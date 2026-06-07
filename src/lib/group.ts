import type {
  Account,
  Change,
  Pipeline,
  PipelineStatus,
  ProviderId,
  Repo
} from '../providers/types'
import type { Snapshots } from './storage'

export interface RepoView {
  repo: Repo
  /** Repo name without the owner prefix. */
  displayName: string
  providerId?: ProviderId
  /** Default-branch headline (pinned), or null if never seen. */
  default: Pipeline | null
  /** Open PRs/MRs, newest number first. */
  changes: Change[]
}

export interface OwnerGroup {
  owner: string
  repos: RepoView[]
}

function splitName(name: string): { owner: string; displayName: string } {
  const slash = name.indexOf('/')
  if (slash === -1) {
    return { owner: name, displayName: name }
  }
  return { owner: name.slice(0, slash), displayName: name.slice(slash + 1) }
}

/** Owner groups (A-Z), each repo split into its default-branch headline + open PRs/MRs. */
export function groupByOwner(
  repos: Repo[],
  snapshots: Snapshots,
  accounts: Account[] = []
): OwnerGroup[] {
  const byOwner = new Map<string, RepoView[]>()
  const providerByAccount = new Map(accounts.map((account) => [account.id, account.provider]))

  for (const repo of repos) {
    const snapshot = snapshots[repo.id] ?? { default: null, changes: [] }
    const { owner, displayName } = splitName(repo.name)
    const view: RepoView = {
      repo,
      displayName,
      providerId: providerByAccount.get(repo.accountId),
      default: snapshot.default,
      changes: [...snapshot.changes].sort((a, b) => b.number - a.number)
    }
    const list = byOwner.get(owner) ?? []
    list.push(view)
    byOwner.set(owner, list)
  }

  return [...byOwner.entries()]
    .map(([owner, views]) => ({
      owner,
      repos: views.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }))
    .sort((a, b) => a.owner.localeCompare(b.owner))
}

export interface RepoOwnerGroup {
  owner: string
  repos: Repo[]
}

/** Owner groups (A-Z) of plain repos, for the picker — no pipeline state needed. */
export function groupReposByOwner(repos: Repo[]): RepoOwnerGroup[] {
  const byOwner = new Map<string, Repo[]>()
  for (const repo of repos) {
    const { owner } = splitName(repo.name)
    const list = byOwner.get(owner) ?? []
    list.push(repo)
    byOwner.set(owner, list)
  }
  return [...byOwner.entries()]
    .map(([owner, list]) => ({
      owner,
      repos: list.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.owner.localeCompare(b.owner))
}

/** Branch states that mean "needs attention" — the popup's problems-only set. */
export const PROBLEM_STATES: ReadonlySet<PipelineStatus> = new Set(['failed', 'running', 'pending'])

/** Branch states in display order — single source for the side-panel pills + the "all" set. */
export const BRANCH_STATE_ORDER: PipelineStatus[] = [
  'failed',
  'running',
  'pending',
  'success',
  'canceled',
  'skipped',
  'unknown'
]

/** Every branch state — the side panel's default (show all). */
export const ALL_BRANCH_STATES: ReadonlySet<PipelineStatus> = new Set(BRANCH_STATE_ORDER)

/** Open PRs/MRs for a repo whose status is in `allowed`. The default branch is never filtered. */
export function visibleChanges(view: RepoView, allowed: ReadonlySet<PipelineStatus>): Change[] {
  return view.changes.filter((change) => allowed.has(change.status))
}

/** Does the default branch pass the status filter? */
export function defaultVisible(view: RepoView, allowed: ReadonlySet<PipelineStatus>): boolean {
  return Boolean(view.default && allowed.has(view.default.status))
}

/** Failing rows in a repo (default branch + open PRs/MRs), for the row badge. */
export function failingCount(view: RepoView): number {
  const fromDefault = view.default?.status === 'failed' ? 1 : 0
  return fromDefault + view.changes.filter((change) => change.status === 'failed').length
}

/** A repo has rows to show when its default branch or any PR/MR passes the filter. */
export function hasVisibleRows(view: RepoView, allowed: ReadonlySet<PipelineStatus>): boolean {
  return defaultVisible(view, allowed) || visibleChanges(view, allowed).length > 0
}

/** Drop repos with no rows under the current filter, then drop emptied owner groups. */
export function filterGroups(
  groups: OwnerGroup[],
  allowed: ReadonlySet<PipelineStatus>
): OwnerGroup[] {
  return groups
    .map((group) => ({
      owner: group.owner,
      repos: group.repos.filter((view) => hasVisibleRows(view, allowed))
    }))
    .filter((group) => group.repos.length > 0)
}

/** Count default-branch pipelines currently failing (drives the alarm strip). */
export function countDefaultBranchFailures(repos: Repo[], snapshots: Snapshots): number {
  let count = 0
  for (const repo of repos) {
    if (snapshots[repo.id]?.default?.status === 'failed') {
      count++
    }
  }
  return count
}
