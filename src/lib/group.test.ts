import {
  groupByOwner,
  groupReposByOwner,
  visibleChanges,
  defaultVisible,
  hasVisibleRows,
  failingCount,
  filterGroups,
  ALL_BRANCH_STATES,
  countDefaultBranchFailures
} from './group'
import type { Change, Pipeline, PipelineStatus, Repo } from '../providers/types'
import type { RepoSnapshot, Snapshots } from './storage'

const PROBLEM_STATES: ReadonlySet<PipelineStatus> = new Set(['failed', 'running', 'pending'])

function repo(name: string, id = name): Repo {
  return { id, accountId: 'a', name, defaultBranch: 'main', webUrl: 'https://x' }
}

function mainPipe(status: PipelineStatus): Pipeline {
  return {
    id: `main-${status}`,
    ref: 'main',
    isDefaultBranch: true,
    status,
    webUrl: 'https://x',
    sha: 's',
    title: 'main',
    updatedAt: '2026-06-06T10:00:00Z'
  }
}

function change(number: number, status: PipelineStatus, isDraft = false, author = 'me'): Change {
  return {
    number,
    title: `PR ${number}`,
    headRef: `f${number}`,
    headSha: `s${number}`,
    status,
    webUrl: `https://x/pull/${number}`,
    isDraft,
    isBot: false,
    author
  }
}

function snapshot(def: Pipeline | null, changes: Change[] = []): RepoSnapshot {
  return { default: def, changes }
}

test('groups by owner, owners and repos A-Z', () => {
  const groups = groupByOwner([repo('zeta/web'), repo('alpha/api'), repo('alpha/cli')], {})
  expect(groups.map((g) => g.owner)).toEqual(['alpha', 'zeta'])
  expect(groups[0].repos.map((r) => r.displayName)).toEqual(['api', 'cli'])
})

test('resolves each repo provider from its account, for PR vs MR wording', () => {
  const accounts = [{ id: 'a', provider: 'gitlab' as const, label: '', host: '', token: '' }]
  const view = groupByOwner([repo('o/r')], {}, accounts)[0].repos[0]
  expect(view.providerId).toBe('gitlab')

  const unknown = groupByOwner([repo('o/r')], {})[0].repos[0]
  expect(unknown.providerId).toBeUndefined()
})

test('groupReposByOwner: owners + repos A-Z, across owners', () => {
  const groups = groupReposByOwner([repo('zeta/web'), repo('alpha/cli'), repo('alpha/api')])
  expect(groups.map((g) => g.owner)).toEqual(['alpha', 'zeta'])
  expect(groups[0].repos.map((r) => r.name)).toEqual(['alpha/api', 'alpha/cli'])
})

test('groupReposByOwner: empty input → no groups', () => {
  expect(groupReposByOwner([])).toEqual([])
})

test('groupReposByOwner: a name with no slash uses the whole name as owner', () => {
  expect(groupReposByOwner([repo('solo', 'solo')])[0].owner).toBe('solo')
})

test('owners and repos stay A-Z regardless of status', () => {
  const snapshots: Snapshots = {
    'zeta/broken': snapshot(mainPipe('failed')),
    'alpha/ok': snapshot(mainPipe('success'))
  }
  const groups = groupByOwner(
    [repo('zeta/broken', 'zeta/broken'), repo('alpha/ok', 'alpha/ok')],
    snapshots
  )
  expect(groups.map((g) => g.owner)).toEqual(['alpha', 'zeta'])
})

test('changes are listed newest number first', () => {
  const snapshots: Snapshots = {
    'o/r': snapshot(null, [change(1, 'success'), change(5, 'failed'), change(3, 'running')])
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(view.changes.map((c) => c.number)).toEqual([5, 3, 1])
})

test('visibleChanges: filters PRs by state; the default branch is never filtered here', () => {
  const snapshots: Snapshots = {
    'o/r': snapshot(mainPipe('failed'), [
      change(1, 'success'),
      change(2, 'running'),
      change(3, 'skipped')
    ])
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(visibleChanges(view, PROBLEM_STATES).map((c) => c.number)).toEqual([2])
  expect(visibleChanges(view, ALL_BRANCH_STATES).map((c) => c.number)).toEqual([3, 2, 1])
})

test('visibleChanges: mineOnly keeps only changes the viewer authored', () => {
  const snapshots: Snapshots = {
    'o/r': snapshot(mainPipe('failed'), [
      change(1, 'failed', false, 'me'),
      change(2, 'failed', false, 'someone-else'),
      change(3, 'failed', false, 'me')
    ])
  }
  const logins = { a: 'me' } // a = the repo's accountId
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots, [], logins)[0].repos[0]
  expect(view.viewerLogin).toBe('me')
  expect(visibleChanges(view, ALL_BRANCH_STATES, true).map((c) => c.number)).toEqual([3, 1])
  expect(visibleChanges(view, ALL_BRANCH_STATES, false).map((c) => c.number)).toEqual([3, 2, 1])
})

test('visibleChanges: mineOnly shows nothing while the viewer identity is still unknown', () => {
  const snapshots: Snapshots = { 'o/r': snapshot(null, [change(1, 'failed', false, 'me')]) }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0] // no logins passed
  expect(view.viewerLogin).toBeUndefined()
  expect(visibleChanges(view, ALL_BRANCH_STATES, true)).toEqual([])
})

test('filterGroups: mineOnly keeps a repo for its default branch even when I own no PRs', () => {
  const snapshots: Snapshots = {
    'o/r': snapshot(mainPipe('failed'), [change(1, 'failed', false, 'someone-else')])
  }
  const logins = { a: 'me' }
  const groups = groupByOwner([repo('o/r', 'o/r')], snapshots, [], logins)
  const filtered = filterGroups(groups, ALL_BRANCH_STATES, true)
  expect(filtered).toHaveLength(1)
  const view = filtered[0].repos[0]
  expect(view.default?.status).toBe('failed')
  expect(visibleChanges(view, ALL_BRANCH_STATES, true)).toEqual([])
})

test('defaultVisible: the status filter applies to the default branch', () => {
  const snapshots: Snapshots = { 'o/r': snapshot(mainPipe('success')) }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(defaultVisible(view, ALL_BRANCH_STATES)).toBe(true)
  expect(defaultVisible(view, PROBLEM_STATES)).toBe(false)
})

test('hasVisibleRows: false when neither default branch nor any PR passes the filter', () => {
  const snapshots: Snapshots = { 'o/r': snapshot(mainPipe('success'), [change(1, 'success')]) }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(hasVisibleRows(view, ALL_BRANCH_STATES)).toBe(true)
  expect(hasVisibleRows(view, PROBLEM_STATES)).toBe(false)
})

test('hasVisibleRows: true when a PR passes even if the default is filtered out', () => {
  const snapshots: Snapshots = { 'o/r': snapshot(mainPipe('success'), [change(1, 'failed')]) }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(hasVisibleRows(view, PROBLEM_STATES)).toBe(true)
})

test('failingCount: counts failed across the default branch + open PRs', () => {
  const snapshots: Snapshots = {
    'o/r': snapshot(mainPipe('failed'), [change(1, 'failed'), change(2, 'success')])
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(failingCount(view)).toBe(2)
})

test('filterGroups: drops filtered-out repos and then empties owner groups', () => {
  const snapshots: Snapshots = {
    'alpha/api': snapshot(mainPipe('failed')),
    'alpha/web': snapshot(mainPipe('success')),
    'zeta/cli': snapshot(mainPipe('success'))
  }
  const groups = groupByOwner([repo('alpha/api'), repo('alpha/web'), repo('zeta/cli')], snapshots)
  const filtered = filterGroups(groups, PROBLEM_STATES)
  expect(filtered.map((g) => g.owner)).toEqual(['alpha'])
  expect(filtered[0].repos.map((r) => r.displayName)).toEqual(['api'])
})

test('repo with no snapshot has a null default and no changes', () => {
  const view = groupByOwner([repo('o/r', 'o/r')], {})[0].repos[0]
  expect(view.default).toBeNull()
  expect(view.changes).toEqual([])
})

test('a name with no slash uses the whole name as owner and display', () => {
  const group = groupByOwner([repo('solo', 'solo')], {})[0]
  expect(group.owner).toBe('solo')
  expect(group.repos[0].displayName).toBe('solo')
})

test('counts only default-branch failures', () => {
  const snapshots: Snapshots = {
    r1: snapshot(mainPipe('failed')),
    r2: snapshot(mainPipe('success'), [change(1, 'failed')]),
    r3: snapshot(mainPipe('failed'))
  }
  const repos = [repo('o/a', 'r1'), repo('o/b', 'r2'), repo('o/c', 'r3')]
  expect(countDefaultBranchFailures(repos, snapshots)).toBe(2)
})
