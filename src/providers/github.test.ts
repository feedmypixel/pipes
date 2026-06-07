import { github, mapGithubStatus } from './github'
import type { Account, Repo } from './types'

const account: Account = {
  id: 'a',
  provider: 'github',
  label: 'work',
  host: 'https://github.com',
  token: 't'
}
const repo: Repo = {
  id: 'o/r',
  accountId: 'a',
  name: 'o/r',
  defaultBranch: 'main',
  webUrl: 'https://x'
}

function stubFetch(response: Response) {
  const original = globalThis.fetch
  globalThis.fetch = (async () => response) as typeof fetch
  return () => {
    globalThis.fetch = original
  }
}

/** listOpenChanges hits /pulls then a /check-runs per PR — route the response by URL. */
function stubFetchByUrl(route: (url: string) => Response) {
  const original = globalThis.fetch
  globalThis.fetch = (async (url: string) => route(String(url))) as typeof fetch
  return () => {
    globalThis.fetch = original
  }
}

test('maps completed GitHub runs by conclusion', () => {
  expect(mapGithubStatus('completed', 'success')).toBe('success')
  expect(mapGithubStatus('completed', 'failure')).toBe('failed')
  expect(mapGithubStatus('completed', 'timed_out')).toBe('failed')
  expect(mapGithubStatus('completed', 'cancelled')).toBe('canceled')
  expect(mapGithubStatus('completed', 'skipped')).toBe('skipped')
})

test('maps in-flight GitHub runs by status, ignoring conclusion', () => {
  expect(mapGithubStatus('in_progress', null)).toBe('running')
  expect(mapGithubStatus('queued', null)).toBe('pending')
  expect(mapGithubStatus('waiting', null)).toBe('pending')
  expect(mapGithubStatus('requested', null)).toBe('pending')
})

test('treats a completed run with no conclusion yet as still settling', () => {
  expect(mapGithubStatus('completed', null)).toBe('pending')
})

test('maps unrecognised conclusion to unknown', () => {
  expect(mapGithubStatus('completed', 'neutral')).toBe('unknown')
})

test('listBranches maps branch names and reads the response etag', async () => {
  const restore = stubFetch(
    new Response(JSON.stringify([{ name: 'main' }, { name: 'dev' }]), {
      status: 200,
      headers: { etag: 'W/"b"' }
    })
  )
  try {
    const result = await github.listBranches(account, repo)
    expect(result.branches).toEqual(['main', 'dev'])
    expect(result.notModified).toBe(false)
    expect(result.etag).toBe('W/"b"')
  } finally {
    restore()
  }
})

test('listBranches 304 keeps the sent etag and flags notModified', async () => {
  const restore = stubFetch(new Response(null, { status: 304 }))
  try {
    const result = await github.listBranches(account, repo, 'W/"prev"')
    expect(result.notModified).toBe(true)
    expect(result.branches).toEqual([])
    expect(result.etag).toBe('W/"prev"')
  } finally {
    restore()
  }
})

test('listOpenChanges maps PRs and collapses head-SHA runs to the worst status', async () => {
  const restore = stubFetchByUrl((url) =>
    url.includes('/pulls')
      ? new Response(
          JSON.stringify([
            {
              number: 7,
              title: 'Add x',
              draft: false,
              html_url: 'https://x/pull/7',
              user: { type: 'User' },
              head: { ref: 'feat', sha: 'sha7' }
            }
          ]),
          { status: 200, headers: { etag: 'W/"p"' } }
        )
      : new Response(
          JSON.stringify({
            workflow_runs: [
              { status: 'completed', conclusion: 'success', workflow_id: 1, updated_at: 't1' },
              { status: 'completed', conclusion: 'failure', workflow_id: 2, updated_at: 't1' }
            ]
          }),
          { status: 200 }
        )
  )
  try {
    const result = await github.listOpenChanges(account, repo)
    expect(result.changes).toEqual([
      {
        number: 7,
        title: 'Add x',
        headRef: 'feat',
        headSha: 'sha7',
        status: 'failed',
        webUrl: 'https://x/pull/7',
        isDraft: false,
        isBot: false
      }
    ])
    expect(result.etag).toBe('W/"p"')
  } finally {
    restore()
  }
})

test('listOpenChanges flags bots and drafts; no runs → unknown', async () => {
  const restore = stubFetchByUrl((url) =>
    url.includes('/pulls')
      ? new Response(
          JSON.stringify([
            {
              number: 9,
              title: 'Bump dep',
              draft: true,
              html_url: 'https://x/pull/9',
              user: { type: 'Bot' },
              head: { ref: 'dependabot/x', sha: 's9' }
            }
          ]),
          { status: 200 }
        )
      : new Response(JSON.stringify({ workflow_runs: [] }), { status: 200 })
  )
  try {
    const [change] = await github.listOpenChanges(account, repo).then((r) => r.changes)
    expect(change.isBot).toBe(true)
    expect(change.isDraft).toBe(true)
    expect(change.status).toBe('unknown')
  } finally {
    restore()
  }
})

test('listOpenChanges 304 flags notModified', async () => {
  const restore = stubFetch(new Response(null, { status: 304 }))
  try {
    const result = await github.listOpenChanges(account, repo, 'W/"prev"')
    expect(result.notModified).toBe(true)
    expect(result.changes).toEqual([])
  } finally {
    restore()
  }
})
