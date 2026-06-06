import {
  groupByOwner,
  groupReposByOwner,
  sortGroups,
  visibleBranches,
  primaryVisible,
  hasVisibleRows,
  failingCount,
  filterGroups,
  PROBLEM_STATES,
  ALL_BRANCH_STATES,
  countDefaultBranchFailures
} from './group'
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

test('sortGroups name keeps the A-Z owner order', () => {
  const groups = groupByOwner([repo('zeta/x'), repo('alpha/y')], {})
  expect(sortGroups(groups, 'name').map((g) => g.owner)).toEqual(['alpha', 'zeta'])
})

test('sortGroups status floats failing repos + their groups to the top', () => {
  const snapshots = {
    'alpha/ok': [pipe('main', 'success', true, '2026-01-01')],
    'zeta/broken': [pipe('main', 'failed', true, '2026-01-01')]
  }
  const groups = groupByOwner(
    [repo('alpha/ok', 'alpha/ok'), repo('zeta/broken', 'zeta/broken')],
    snapshots
  )
  expect(sortGroups(groups, 'status').map((g) => g.owner)).toEqual(['zeta', 'alpha'])
})

test('visibleBranches: filters non-default branches by state, newest first', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('main', 'failed', true, '2026-06-06T10:00:00Z'),
      pipe('feat-pass', 'success', false, '2026-06-06T09:00:00Z'),
      pipe('feat-run', 'running', false, '2026-06-06T08:00:00Z'),
      pipe('feat-skip', 'skipped', false, '2026-06-06T07:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  // problems-only excludes the passing + skipped branches, and never the default branch.
  expect(visibleBranches(view, PROBLEM_STATES).map((p) => p.ref)).toEqual(['feat-run'])
  expect(visibleBranches(view, ALL_BRANCH_STATES).map((p) => p.ref)).toEqual([
    'feat-pass',
    'feat-run',
    'feat-skip'
  ])
})

test('primaryVisible: the status filter applies to the default branch too', () => {
  const snapshots: Snapshots = { 'o/r': [pipe('main', 'success', true, '2026-06-06T10:00:00Z')] }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(primaryVisible(view, ALL_BRANCH_STATES)).toBe(true)
  expect(primaryVisible(view, PROBLEM_STATES)).toBe(false)
})

test('hasVisibleRows: false when neither default branch nor any branch passes the filter', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('main', 'success', true, '2026-06-06T10:00:00Z'),
      pipe('feat', 'success', false, '2026-06-06T09:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(hasVisibleRows(view, ALL_BRANCH_STATES)).toBe(true)
  expect(hasVisibleRows(view, PROBLEM_STATES)).toBe(false)
})

test('hasVisibleRows: true when a non-default branch passes even if the default is filtered out', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('main', 'success', true, '2026-06-06T10:00:00Z'),
      pipe('feat', 'failed', false, '2026-06-06T09:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(hasVisibleRows(view, PROBLEM_STATES)).toBe(true)
})

test('failingCount: counts failed pipelines across default + other branches', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('main', 'failed', true, '2026-06-06T10:00:00Z'),
      pipe('feat-a', 'failed', false, '2026-06-06T09:00:00Z'),
      pipe('feat-b', 'success', false, '2026-06-06T08:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(failingCount(view)).toBe(2)
})

test('filterGroups: drops filtered-out repos and then empties owner groups', () => {
  const snapshots: Snapshots = {
    'alpha/api': [pipe('main', 'failed', true, '2026-06-06T10:00:00Z')],
    'alpha/web': [pipe('main', 'success', true, '2026-06-06T10:00:00Z')],
    'zeta/cli': [pipe('main', 'success', true, '2026-06-06T10:00:00Z')]
  }
  const groups = groupByOwner([repo('alpha/api'), repo('alpha/web'), repo('zeta/cli')], snapshots)
  const filtered = filterGroups(groups, PROBLEM_STATES)
  expect(filtered.map((g) => g.owner)).toEqual(['alpha'])
  expect(filtered[0].repos.map((r) => r.displayName)).toEqual(['api'])
})

test('splits primary, active (live/broken), and collapsed (settled), newest first', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('main', 'failed', true, '2026-06-06T10:00:00Z'),
      pipe('feat-pass', 'success', false, '2026-06-06T09:00:00Z'),
      pipe('feat-run', 'running', false, '2026-06-06T08:00:00Z'),
      pipe('feat-fail', 'failed', false, '2026-06-06T07:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(view.displayName).toBe('r')
  expect(view.primary?.ref).toBe('main')
  expect(view.active.map((p) => p.ref)).toEqual(['feat-run', 'feat-fail'])
  expect(view.collapsed.map((p) => p.ref)).toEqual(['feat-pass'])
})

test('pending branches are active; canceled and skipped collapse', () => {
  const snapshots: Snapshots = {
    'o/r': [
      pipe('queued', 'pending', false, '2026-06-06T03:00:00Z'),
      pipe('cancelled-one', 'canceled', false, '2026-06-06T02:00:00Z'),
      pipe('skipped-one', 'skipped', false, '2026-06-06T01:00:00Z')
    ]
  }
  const view = groupByOwner([repo('o/r', 'o/r')], snapshots)[0].repos[0]
  expect(view.active.map((p) => p.ref)).toEqual(['queued'])
  expect(view.collapsed.map((p) => p.ref)).toEqual(['cancelled-one', 'skipped-one'])
})

test('repo with no snapshot has empty primary/active/collapsed', () => {
  const view = groupByOwner([repo('o/r', 'o/r')], {})[0].repos[0]
  expect(view.primary).toBeUndefined()
  expect(view.active).toEqual([])
  expect(view.collapsed).toEqual([])
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
