import type { Pipeline, Repo } from '../providers/types'
import type { Snapshots } from './storage'

export interface RepoView {
  repo: Repo
  /** Repo name with the owner prefix stripped. */
  displayName: string
  /** The default-branch pipeline, if present. */
  primary: Pipeline | undefined
  /** Non-default-branch pipelines, newest first. */
  others: Pipeline[]
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

/** Group watched repos by owner (owners A-Z, repos A-Z), splitting each repo's
 *  pipelines into the default-branch primary and the other refs. */
export function groupByOwner(repos: Repo[], snapshots: Snapshots): OwnerGroup[] {
  const byOwner = new Map<string, RepoView[]>()

  for (const repo of repos) {
    const pipelines = snapshots[repo.id] ?? []
    const { owner, displayName } = splitName(repo.name)
    const view: RepoView = {
      repo,
      displayName,
      primary: pipelines.find((p) => p.isDefaultBranch),
      others: pipelines.filter((p) => !p.isDefaultBranch).sort(newestFirst)
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
