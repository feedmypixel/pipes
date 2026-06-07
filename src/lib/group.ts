import type { Pipeline, PipelineStatus, Repo } from '../providers/types'
import type { Snapshots } from './storage'

// Live / needs-attention; non-default branches in any other state collapse.
const ALWAYS_SHOWN: ReadonlySet<PipelineStatus> = new Set(['failed', 'running', 'pending'])

export interface RepoView {
  repo: Repo
  /** Repo name without the owner prefix. */
  displayName: string
  primary: Pipeline | undefined
  /** Live/broken non-default branches, always shown, newest first. */
  active: Pipeline[]
  /** Settled non-default branches, collapsed, newest first. */
  collapsed: Pipeline[]
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

function newestFirst(a: Pipeline, b: Pipeline): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

/** Owner groups (A-Z), each repo split into default-branch primary, active, collapsed. */
export function groupByOwner(repos: Repo[], snapshots: Snapshots): OwnerGroup[] {
  const byOwner = new Map<string, RepoView[]>()

  for (const repo of repos) {
    const pipelines = snapshots[repo.id] ?? []
    const nonDefault = pipelines.filter((p) => !p.isDefaultBranch)
    const { owner, displayName } = splitName(repo.name)
    const view: RepoView = {
      repo,
      displayName,
      primary: pipelines.find((p) => p.isDefaultBranch),
      active: nonDefault.filter((p) => ALWAYS_SHOWN.has(p.status)).sort(newestFirst),
      collapsed: nonDefault.filter((p) => !ALWAYS_SHOWN.has(p.status)).sort(newestFirst)
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

/** Sort priority of a repo by its default-branch state: trouble first. */
const STATUS_RANK: Record<PipelineStatus, number> = {
  failed: 0,
  running: 1,
  pending: 2,
  canceled: 3,
  skipped: 3,
  unknown: 3,
  success: 4
}

function viewRank(view: RepoView): number {
  return view.primary ? STATUS_RANK[view.primary.status] : 5
}

export type SortMode = 'name' | 'status'

/**
 * Re-order owner groups for the side panel. `name` keeps the A-Z grouping;
 * `status` floats troubled repos (and the groups containing them) to the top.
 */
export function sortGroups(groups: OwnerGroup[], mode: SortMode): OwnerGroup[] {
  if (mode === 'name') {
    return groups
  }
  return groups
    .map((group) => ({
      owner: group.owner,
      repos: [...group.repos].sort(
        (a, b) => viewRank(a) - viewRank(b) || a.displayName.localeCompare(b.displayName)
      )
    }))
    .sort((a, b) => viewRank(a.repos[0]) - viewRank(b.repos[0]) || a.owner.localeCompare(b.owner))
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

/**
 * Non-default branch pipelines for a repo whose status is in `allowed`, newest first.
 * Replaces the active/collapsed split — the default branch (primary) is never filtered.
 */
export function visibleBranches(view: RepoView, allowed: ReadonlySet<PipelineStatus>): Pipeline[] {
  return [...view.active, ...view.collapsed].filter((p) => allowed.has(p.status)).sort(newestFirst)
}

/** Does the default branch pass the status filter? */
export function primaryVisible(view: RepoView, allowed: ReadonlySet<PipelineStatus>): boolean {
  return Boolean(view.primary && allowed.has(view.primary.status))
}

/** Failing pipelines in a repo (default branch + every other branch), for the row badge. */
export function failingCount(view: RepoView): number {
  const all = [view.primary, ...view.active, ...view.collapsed]
  return all.filter((pipeline) => pipeline?.status === 'failed').length
}

/** A repo has rows to show when its default branch or any branch passes the filter. */
export function hasVisibleRows(view: RepoView, allowed: ReadonlySet<PipelineStatus>): boolean {
  return primaryVisible(view, allowed) || visibleBranches(view, allowed).length > 0
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
    const primary = (snapshots[repo.id] ?? []).find((p) => p.isDefaultBranch)
    if (primary?.status === 'failed') {
      count++
    }
  }
  return count
}

/** Count every failing branch across all repos (default + feature) — sum of the row badges. */
export function countFailingBranches(repos: Repo[], snapshots: Snapshots): number {
  let count = 0
  for (const repo of repos) {
    for (const pipeline of snapshots[repo.id] ?? []) {
      if (pipeline.status === 'failed') {
        count++
      }
    }
  }
  return count
}
