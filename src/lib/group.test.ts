import { groupByOwner, countDefaultBranchFailures } from './group'
import type { Pipeline, PipelineStatus, Repo } from '../providers/types'
import type { Snapshots } from './storage'

function repo(name: string, id = name): Repo {
  return { id, accountId: 'a', name, defaultBranch: 'main', webUrl: 'https://x' }
}

function pipe(
  ref: string,
  status: PipelineStatus,
  isDefaultBranch: boolean,
  updatedAt: string
): Pipeline {
  return {
    id: `${ref}-${updatedAt}`,
    ref,
    isDefaultBranch,
    status,
    webUrl: 'https://x',
    sha: 's',
    title: ref,
    updatedAt
  }
}

test('groups by owner, owners and repos A-Z', () => {
  const groups = groupByOwner([repo('zeta/web'), repo('alpha/api'), repo('alpha/cli')], {})
  expect(groups.map((g) => g.owner)).toEqual(['alpha', 'zeta'])
  expect(groups[0].repos.map((r) => r.displayName)).toEqual(['api', 'cli'])
})

test('splits default-branch primary from other refs, newest first', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('main', 'failed', true, '2026-06-06T10:00:00Z'),
      pipe('feat-a', 'success', false, '2026-06-06T08:00:00Z'),
      pipe('feat-b', 'running', false, '2026-06-06T09:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(view.displayName).toBe('r')
  expect(view.primary?.ref).toBe('main')
  expect(view.others.map((p) => p.ref)).toEqual(['feat-b', 'feat-a'])
})

test('repo with no snapshot has no primary and no others', () => {
  const view = groupByOwner([repo('o/r', 'o/r')], {})[0].repos[0]
  expect(view.primary).toBeUndefined()
  expect(view.others).toEqual([])
})

test('a name with no slash uses the whole name as owner and display', () => {
  const group = groupByOwner([repo('solo', 'solo')], {})[0]
  expect(group.owner).toBe('solo')
  expect(group.repos[0].displayName).toBe('solo')
})

test('counts only default-branch failures', () => {
  const snapshots: Snapshots = {
    r1: [pipe('main', 'failed', true, 't')],
    r2: [pipe('main', 'success', true, 't'), pipe('pr', 'failed', false, 't')],
    r3: [pipe('main', 'failed', true, 't')]
  }
  const repos = [repo('o/a', 'r1'), repo('o/b', 'r2'), repo('o/c', 'r3')]
  expect(countDefaultBranchFailures(repos, snapshots)).toBe(2)
})
