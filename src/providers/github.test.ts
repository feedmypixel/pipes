import { github, mapGithubStatus, pipelinesFromRuns } from './github'
import { RateLimitError } from './http'
import type { Account, Repo } from './types'

function run(overrides: Partial<Parameters<typeof pipelinesFromRuns>[0][number]> = {}) {
  return {
    head_branch: 'main',
    status: 'completed',
    conclusion: 'success',
    html_url: 'https://x/run',
    head_sha: 'sha1',
    updated_at: '2026-06-13T10:00:00Z',
    run_started_at: '2026-06-13T10:00:00Z',
    display_title: 'Title',
    id: 1,
    workflow_id: 1,
    ...overrides
  }
}

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

test('rolls a ref up to its worst workflow — a later green run cannot mask an earlier red one', () => {
  // The live bug: two workflows on one commit, the failure finishing before the pass.
  const [pipeline] = pipelinesFromRuns(
    [
      run({
        workflow_id: 1,
        conclusion: 'failure',
        updated_at: '2026-06-13T10:20:16Z',
        html_url: 'https://x/fail',
        id: 11
      }),
      run({ workflow_id: 2, conclusion: 'success', updated_at: '2026-06-13T10:22:20Z', id: 22 })
    ],
    'main'
  )
  expect(pipeline.status).toBe('failed')
  expect(pipeline.webUrl).toBe('https://x/fail') // deep-links to the run that failed
})

test('rolls up by worst status, not just failure (a run still in flight beats a green sibling)', () => {
  const [pipeline] = pipelinesFromRuns(
    [
      run({ workflow_id: 1, status: 'in_progress', conclusion: null }),
      run({ workflow_id: 2, conclusion: 'success' })
    ],
    'main'
  )
  expect(pipeline.status).toBe('running')
})

test('ignores stale runs from a previous commit on the same ref', () => {
  const [pipeline] = pipelinesFromRuns(
    [
      run({ head_sha: 'old', conclusion: 'failure', updated_at: '2026-06-13T09:00:00Z' }),
      run({ head_sha: 'new', conclusion: 'success', updated_at: '2026-06-13T10:00:00Z' })
    ],
    'main'
  )
  expect(pipeline.status).toBe('success')
  expect(pipeline.sha).toBe('new')
})

test('a workflow re-run supersedes its earlier attempt', () => {
  const [pipeline] = pipelinesFromRuns(
    [
      run({
        workflow_id: 1,
        conclusion: 'failure',
        run_started_at: '2026-06-13T10:00:00Z',
        updated_at: '2026-06-13T10:05:00Z'
      }),
      run({
        workflow_id: 1,
        conclusion: 'success',
        run_started_at: '2026-06-13T10:10:00Z',
        updated_at: '2026-06-13T10:15:00Z'
      })
    ],
    'main'
  )
  expect(pipeline.status).toBe('success')
})

test('one pipeline per ref, newest ref first', () => {
  const pipelines = pipelinesFromRuns(
    [
      run({ head_branch: 'main', updated_at: '2026-06-13T10:00:00Z' }),
      run({ head_branch: 'feat', updated_at: '2026-06-13T11:00:00Z' })
    ],
    'main'
  )
  expect(pipelines.map((pipeline) => pipeline.ref)).toEqual(['feat', 'main'])
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
          user: { login: 'octocat', type: 'User' },
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
        isBot: false,
        author: 'octocat'
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
          user: { login: 'dependabot[bot]', type: 'Bot' },
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

// Records the request URLs so the Enterprise base-path can be asserted.
function captureFetch(response: Response) {
  const calls: string[] = []
  const original = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input))
    return response.clone()
  }) as typeof fetch
  return {
    calls,
    restore: () => {
      globalThis.fetch = original
    }
  }
}

test('validateToken returns the user on success', async () => {
  const restore = stubFetch(new Response(JSON.stringify({ login: 'octocat' }), { status: 200 }))
  try {
    expect(await github.validateToken(account)).toEqual({ ok: true, user: 'octocat' })
  } finally {
    restore()
  }
})

test('validateToken reports an invalid token (401) as not ok', async () => {
  const restore = stubFetch(new Response('no', { status: 401 }))
  try {
    expect((await github.validateToken(account)).ok).toBe(false)
  } finally {
    restore()
  }
})

test('validateToken throws (not "invalid") when rate-limited, so the poll loop pauses the account', async () => {
  const restore = stubFetch(
    new Response('limited', {
      status: 403,
      headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '9999999999' }
    })
  )
  try {
    await expect(github.validateToken(account)).rejects.toBeInstanceOf(RateLimitError)
  } finally {
    restore()
  }
})

test('listPipelines maps a 200 runs payload through the roll-up', async () => {
  const restore = stubFetch(
    new Response(
      JSON.stringify({
        workflow_runs: [
          {
            head_branch: 'main',
            status: 'completed',
            conclusion: 'success',
            html_url: 'https://x/run',
            head_sha: 'sha',
            updated_at: '2026-06-13T10:00:00Z',
            run_started_at: '2026-06-13T09:59:00Z',
            display_title: 'CI',
            id: 1,
            workflow_id: 1
          }
        ]
      }),
      { status: 200, headers: { etag: 'W/"r"' } }
    )
  )
  try {
    const result = await github.listPipelines(account, repo)
    expect(result.notModified).toBe(false)
    expect(result.etag).toBe('W/"r"')
    expect(result.pipelines).toHaveLength(1)
    expect(result.pipelines[0]).toMatchObject({
      ref: 'main',
      status: 'success',
      isDefaultBranch: true
    })
  } finally {
    restore()
  }
})

test('listPipelines flags a 304 as notModified', async () => {
  const restore = stubFetch(new Response(null, { status: 304 }))
  try {
    const result = await github.listPipelines(account, repo, 'W/"prev"')
    expect(result.notModified).toBe(true)
    expect(result.pipelines).toEqual([])
  } finally {
    restore()
  }
})

test('apiBase targets the Enterprise /api/v3 path for a non-github.com host', async () => {
  const capture = captureFetch(new Response(JSON.stringify({ login: 'e' }), { status: 200 }))
  try {
    await github.validateToken({ ...account, host: 'https://ghe.example.com' })
    expect(capture.calls[0]).toBe('https://ghe.example.com/api/v3/user')
  } finally {
    capture.restore()
  }
})
