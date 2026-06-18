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
  /** Authenticated login for this repo's account, for the "mine" scope filter. Undefined until
   * the first health check resolves it. */
  viewerLogin?: string
}

export interface OwnerGroup {
  /** The org/owner slug — keyed on, and used for the provider owner-page link. */
  owner: string
  /** Header display name: the connection label when the owner's repos all come from one labelled
   * account, else the owner slug. So a user's "Work" / "feedMyPixel" labels show in the panel. */
  label: string
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
  accounts: Account[] = [],
  viewerLogins: Record<string, string> = {}
): OwnerGroup[] {
  const byOwner = new Map<string, RepoView[]>()
  const providerByAccount = new Map(accounts.map((account) => [account.id, account.provider]))
  const labelByAccount = new Map(accounts.map((account) => [account.id, account.label]))
  // Distinct connection labels seen per owner — a single one means we can show it as the header.
  const labelsByOwner = new Map<string, Set<string>>()

  for (const repo of repos) {
    const snapshot = snapshots[repo.id] ?? { default: null, changes: [] }
    const { owner, displayName } = splitName(repo.name)
    const view: RepoView = {
      repo,
      displayName,
      providerId: providerByAccount.get(repo.accountId),
      default: snapshot.default,
      changes: [...snapshot.changes].sort((a, b) => b.number - a.number),
      viewerLogin: viewerLogins[repo.accountId]
    }
    const list = byOwner.get(owner) ?? []
    list.push(view)
    byOwner.set(owner, list)

    const label = labelByAccount.get(repo.accountId)
    if (label) {
      const labels = labelsByOwner.get(owner) ?? new Set<string>()
      labels.add(label)
      labelsByOwner.set(owner, labels)
    }
  }

  return [...byOwner.entries()]
    .map(([owner, views]) => {
      const labels = labelsByOwner.get(owner)
      const label = labels?.size === 1 ? [...labels][0] : owner
      return {
        owner,
        label,
        repos: views.sort((a, b) => a.displayName.localeCompare(b.displayName))
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
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

/** True when a change was opened by the account's authenticated user. */
function isMine(change: Change, view: RepoView): boolean {
  return change.author !== '' && change.author === view.viewerLogin
}

/**
 * Open PRs/MRs for a repo whose status is in `allowed`. The default branch is never filtered.
 * `mineOnly` further narrows to changes the viewer authored — the "mine" scope.
 */
export function visibleChanges(
  view: RepoView,
  allowed: ReadonlySet<PipelineStatus>,
  mineOnly = false
): Change[] {
  return view.changes.filter(
    (change) => allowed.has(change.status) && (!mineOnly || isMine(change, view))
  )
}

/** Does the default branch pass the status filter? */
export function defaultVisible(view: RepoView, allowed: ReadonlySet<PipelineStatus>): boolean {
  return Boolean(view.default && allowed.has(view.default.status))
}

/**
 * Failing rows currently visible in a repo — the default branch plus the PRs/MRs shown under the
 * active status filter and All/Mine scope. The badge tracks what you can see, so switching to Mine
 * counts your failing PRs (and a failing main, which always shows), not everyone's.
 */
export function failingCount(
  view: RepoView,
  allowed: ReadonlySet<PipelineStatus>,
  mineOnly = false
): number {
  const fromDefault = defaultVisible(view, allowed) && view.default?.status === 'failed' ? 1 : 0
  return (
    fromDefault +
    visibleChanges(view, allowed, mineOnly).filter((change) => change.status === 'failed').length
  )
}

/** A repo has rows to show when its default branch or any PR/MR passes the filter. */
export function hasVisibleRows(
  view: RepoView,
  allowed: ReadonlySet<PipelineStatus>,
  mineOnly = false
): boolean {
  return defaultVisible(view, allowed) || visibleChanges(view, allowed, mineOnly).length > 0
}

/** Drop repos with no rows under the current filter, then drop emptied owner groups. */
export function filterGroups(
  groups: OwnerGroup[],
  allowed: ReadonlySet<PipelineStatus>,
  mineOnly = false
): OwnerGroup[] {
  return groups
    .map((group) => ({
      owner: group.owner,
      label: group.label,
      repos: group.repos.filter((view) => hasVisibleRows(view, allowed, mineOnly))
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
