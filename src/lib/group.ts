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
