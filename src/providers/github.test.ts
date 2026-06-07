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

test('listOpenChanges maps open PRs to metadata (status is joined in poll)', async () => {
  const restore = stubFetch(
    new Response(
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
  )
  try {
    const result = await github.listOpenChanges(account, repo)
    expect(result.changes).toEqual([
      {
        number: 7,
        title: 'Add x',
        headRef: 'feat',
        headSha: 'sha7',
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

test('listOpenChanges flags bots and drafts', async () => {
  const restore = stubFetch(
    new Response(
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
  )
  try {
    const [change] = await github.listOpenChanges(account, repo).then((r) => r.changes)
    expect(change.isBot).toBe(true)
    expect(change.isDraft).toBe(true)
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
