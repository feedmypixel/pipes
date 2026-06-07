import { gitlab, mapGitlabStatus } from './gitlab'
import type { Account, Repo } from './types'

const account: Account = {
  id: 'a',
  provider: 'gitlab',
  label: 'work',
  host: 'https://gitlab.com',
  token: 't'
}
const repo: Repo = {
  id: '42',
  accountId: 'a',
  name: 'g/p',
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

test('maps terminal GitLab statuses', () => {
  expect(mapGitlabStatus('success')).toBe('success')
  expect(mapGitlabStatus('failed')).toBe('failed')
  expect(mapGitlabStatus('canceled')).toBe('canceled')
  expect(mapGitlabStatus('skipped')).toBe('skipped')
})

test('maps in-flight GitLab statuses', () => {
  expect(mapGitlabStatus('running')).toBe('running')
  expect(mapGitlabStatus('pending')).toBe('pending')
  expect(mapGitlabStatus('created')).toBe('pending')
  expect(mapGitlabStatus('waiting_for_resource')).toBe('pending')
  expect(mapGitlabStatus('preparing')).toBe('pending')
  expect(mapGitlabStatus('scheduled')).toBe('pending')
  expect(mapGitlabStatus('manual')).toBe('pending')
})

test('maps unknown GitLab status to unknown', () => {
  expect(mapGitlabStatus('something-new')).toBe('unknown')
})

test('listBranches maps branch names and reads the response etag', async () => {
  const restore = stubFetch(
    new Response(JSON.stringify([{ name: 'main' }, { name: 'dev' }]), {
      status: 200,
      headers: { etag: 'W/"b"' }
    })
  )
  try {
    const result = await gitlab.listBranches(account, repo)
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
    const result = await gitlab.listBranches(account, repo, 'W/"prev"')
    expect(result.notModified).toBe(true)
    expect(result.branches).toEqual([])
    expect(result.etag).toBe('W/"prev"')
  } finally {
    restore()
  }
})
