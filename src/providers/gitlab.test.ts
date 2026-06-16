import { gitlab, mapGitlabStatus } from './gitlab'
import { RateLimitError } from './http'
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

test('listOpenChanges maps open MRs to metadata (status is joined in poll)', async () => {
  const restore = stubFetch(
    new Response(
      JSON.stringify([
        {
          iid: 3,
          title: 'Fix',
          draft: false,
          web_url: 'https://x/mr/3',
          source_branch: 'fix',
          sha: 's3',
          author: { bot: false }
        }
      ]),
      { status: 200, headers: { etag: 'W/"m"' } }
    )
  )
  try {
    const result = await gitlab.listOpenChanges(account, repo)
    expect(result.changes).toEqual([
      {
        number: 3,
        title: 'Fix',
        headRef: 'fix',
        headSha: 's3',
        webUrl: 'https://x/mr/3',
        isDraft: false,
        isBot: false
      }
    ])
    expect(result.etag).toBe('W/"m"')
  } finally {
    restore()
  }
})

test('listOpenChanges flags draft + bot MRs', async () => {
  const restore = stubFetch(
    new Response(
      JSON.stringify([
        {
          iid: 4,
          title: 'WIP',
          draft: true,
          web_url: 'https://x/mr/4',
          source_branch: 'wip',
          sha: 's4',
          author: { bot: true }
        }
      ]),
      { status: 200 }
    )
  )
  try {
    const [change] = await gitlab.listOpenChanges(account, repo).then((r) => r.changes)
    expect(change.isDraft).toBe(true)
    expect(change.isBot).toBe(true)
  } finally {
    restore()
  }
})

test('listOpenChanges 304 flags notModified', async () => {
  const restore = stubFetch(new Response(null, { status: 304 }))
  try {
    const result = await gitlab.listOpenChanges(account, repo, 'W/"prev"')
    expect(result.notModified).toBe(true)
    expect(result.changes).toEqual([])
  } finally {
    restore()
  }
})

function stubByUrl(map: Record<string, Response>) {
  const original = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    const key = Object.keys(map).find((part) => url.includes(part))
    return key ? map[key].clone() : new Response('{}', { status: 404 })
  }) as typeof fetch
  return () => {
    globalThis.fetch = original
  }
}

test('listPipelines sets the default-branch title to its commit message', async () => {
  const restore = stubByUrl({
    '/pipelines?': new Response(
      JSON.stringify([
        {
          id: 99,
          status: 'failed',
          ref: 'main',
          sha: 'titlesha1',
          web_url: 'https://x/p/99',
          updated_at: '2026-06-08T00:00:00Z'
        }
      ]),
      { status: 200 }
    ),
    '/repository/commits/titlesha1': new Response(
      JSON.stringify({ title: 'fix: broke the build' }),
      { status: 200 }
    )
  })
  try {
    const { pipelines } = await gitlab.listPipelines(account, repo)
    expect(pipelines.find((pipeline) => pipeline.isDefaultBranch)?.title).toBe(
      'fix: broke the build'
    )
  } finally {
    restore()
  }
})

test('listPipelines keeps the newest pipeline per ref by id, not by update time', async () => {
  // GitLab cancels a superseded run when a new commit lands, which bumps the canceled run's
  // updated_at above the newer run that is still pending/running. Ordered by updated_at the
  // canceled run sorts first, so a first-seen-wins dedup would mask the live run. Pick by id.
  const restore = stubFetch(
    new Response(
      JSON.stringify([
        {
          id: 200,
          status: 'canceled',
          ref: 'feature',
          sha: 'old',
          web_url: 'https://x/p/200',
          updated_at: '2026-06-16T10:05:00Z',
          created_at: '2026-06-16T10:00:00Z'
        },
        {
          id: 201,
          status: 'running',
          ref: 'feature',
          sha: 'new',
          web_url: 'https://x/p/201',
          updated_at: '2026-06-16T10:04:00Z',
          created_at: '2026-06-16T10:04:00Z'
        }
      ]),
      { status: 200 }
    )
  )
  try {
    const { pipelines } = await gitlab.listPipelines(account, repo)
    const feature = pipelines.filter((pipeline) => pipeline.ref === 'feature')
    expect(feature).toHaveLength(1)
    expect(feature[0].id).toBe('201')
    expect(feature[0].status).toBe('running')
  } finally {
    restore()
  }
})

test('validateToken returns the username on success', async () => {
  const restore = stubFetch(new Response(JSON.stringify({ username: 'dev' }), { status: 200 }))
  try {
    expect(await gitlab.validateToken(account)).toEqual({ ok: true, user: 'dev' })
  } finally {
    restore()
  }
})

test('validateToken reports an invalid token (401) as not ok', async () => {
  const restore = stubFetch(new Response('no', { status: 401 }))
  try {
    expect((await gitlab.validateToken(account)).ok).toBe(false)
  } finally {
    restore()
  }
})

test('validateToken throws (not "invalid") when rate-limited, so the poll loop pauses the account', async () => {
  const restore = stubFetch(
    new Response('slow down', { status: 429, headers: { 'retry-after': '30' } })
  )
  try {
    await expect(gitlab.validateToken(account)).rejects.toBeInstanceOf(RateLimitError)
  } finally {
    restore()
  }
})
