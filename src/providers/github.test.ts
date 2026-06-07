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
