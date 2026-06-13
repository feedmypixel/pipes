import type {
  Account,
  ChangeMeta,
  OpenChangesResult,
  Pipeline,
  PipelineStatus,
  PipelinesResult,
  Provider,
  Repo,
  ValidationResult
} from './types'
import { fetchJson, httpUrl, RateLimitError, type RateLimitHeaders } from './http'
import { SAAS_HOST } from '../lib/config'

const SAAS_API = 'https://api.github.com'
const REPO_PAGES = 3 // up to 300 repos
// Enough recent runs to cover every active ref (default + open PR head branches) in one fetch.
const RUNS_PER_REPO = 100
const RATE_LIMIT_HEADERS: RateLimitHeaders = {
  remaining: 'x-ratelimit-remaining',
  reset: 'x-ratelimit-reset'
}

/** api.github.com for SaaS; {host}/api/v3 for GitHub Enterprise Server. */
function apiBase(account: Account): string {
  return account.host.replace(/\/$/, '') === SAAS_HOST.github
    ? SAAS_API
    : `${account.host.replace(/\/$/, '')}/api/v3`
}

function headers(account: Account): Record<string, string> {
  return {
    Authorization: `Bearer ${account.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

async function request<T>(account: Account, path: string): Promise<T> {
  // Pass the rate-limit headers so a primary-rate-limit 403 (remaining 0) is recognised as a
  // RateLimitError, not a generic failure that would mark the connection as a bad token.
  const { data } = await fetchJson<T>(`${apiBase(account)}${path}`, headers(account), {
    rateLimitHeaders: RATE_LIMIT_HEADERS
  })
  return data as T
}

interface GhRepo {
  full_name: string
  default_branch: string
  html_url: string
}

interface GhRun {
  head_branch: string | null
  status: string | null
  conclusion: string | null
  html_url: string
  head_sha: string
  updated_at: string
  run_started_at: string
  display_title: string
  id: number
  workflow_id: number
}

interface GhPull {
  number: number
  title: string
  draft: boolean
  html_url: string
  user: { type: string } | null
  head: { ref: string; sha: string }
}

export function mapGithubStatus(status: string | null, conclusion: string | null): PipelineStatus {
  if (status !== 'completed') {
    return status === 'in_progress' ? 'running' : 'pending'
  }
  // A completed run with no conclusion yet is still settling, not a terminal state.
  if (conclusion === null) {
    return 'pending'
  }
  switch (conclusion) {
    case 'success':
      return 'success'
    case 'failure':
    case 'timed_out':
      return 'failed'
    case 'cancelled':
      return 'canceled'
    case 'skipped':
      return 'skipped'
    default:
      return 'unknown'
  }
}

// Worst-wins order for rolling several workflow runs up to one ref status: a failure outranks
// anything still in flight, which outranks a pass. Keeps Pipes loud — a green run never masks a red.
const STATUS_RANK: PipelineStatus[] = [
  'failed',
  'running',
  'pending',
  'success',
  'canceled',
  'skipped',
  'unknown'
]

function worse(a: PipelineStatus, b: PipelineStatus): PipelineStatus {
  return STATUS_RANK.indexOf(a) <= STATUS_RANK.indexOf(b) ? a : b
}

/**
 * One Pipeline per ref, its status rolled up across every workflow on the ref's current commit.
 * GitHub runs a separate workflow run per workflow file (CI, security scan, …), so a ref has many
 * runs at once; the ref is failing if ANY of them failed, regardless of which finished last. We
 * also drop runs from older commits (stale) and keep only the latest attempt per workflow (so a
 * re-run supersedes its earlier failure). The status icon deep-links to the run that set the status.
 */
export function pipelinesFromRuns(runs: GhRun[], defaultBranch: string): Pipeline[] {
  const byRef = new Map<string, GhRun[]>()
  for (const run of runs) {
    const ref = run.head_branch ?? '(detached)'
    const list = byRef.get(ref)
    if (list) {
      list.push(run)
    } else {
      byRef.set(ref, [run])
    }
  }

  const pipelines: Pipeline[] = []
  for (const [ref, refRuns] of byRef) {
    // Current commit = the head_sha of this ref's most-recently-updated run; older commits are stale.
    const newest = refRuns.reduce((a, b) => (b.updated_at > a.updated_at ? b : a))
    const current = refRuns.filter((run) => run.head_sha === newest.head_sha)

    // Latest attempt per workflow, so a re-run replaces its earlier result.
    const latestPerWorkflow = new Map<number, GhRun>()
    for (const run of current) {
      const existing = latestPerWorkflow.get(run.workflow_id)
      if (!existing || run.run_started_at > existing.run_started_at) {
        latestPerWorkflow.set(run.workflow_id, run)
      }
    }
    const workflowRuns = [...latestPerWorkflow.values()]

    let status = mapGithubStatus(workflowRuns[0].status, workflowRuns[0].conclusion)
    for (const run of workflowRuns.slice(1)) {
      status = worse(status, mapGithubStatus(run.status, run.conclusion))
    }
    // The run that set the status (a failure if there is one) — deep-link there.
    const lead =
      workflowRuns.find((run) => mapGithubStatus(run.status, run.conclusion) === status) ?? newest
    const updatedAt = current.reduce((latest, run) =>
      run.updated_at > latest.updated_at ? run : latest
    ).updated_at
    // Earliest start among the current workflows, so a live "running Xm" reflects the whole commit.
    const startedAt = workflowRuns.reduce((earliest, run) =>
      run.run_started_at < earliest.run_started_at ? run : earliest
    ).run_started_at

    pipelines.push({
      id: String(lead.id),
      ref,
      isDefaultBranch: ref === defaultBranch,
      status,
      webUrl: httpUrl(lead.html_url),
      sha: newest.head_sha,
      title: lead.display_title,
      updatedAt,
      startedAt
    })
  }

  return pipelines.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export const github: Provider = {
  async validateToken(account: Account): Promise<ValidationResult> {
    try {
      const user = await request<{ login: string }>(account, '/user')
      return { ok: true, user: user.login }
    } catch (error) {
      // A rate-limit is not a bad token: let it propagate so the poll loop pauses the account
      // and keeps it healthy, rather than flashing a "connection invalid" banner.
      if (error instanceof RateLimitError) {
        throw error
      }
      return { ok: false, error: (error as Error).message }
    }
  },

  async listRepos(account: Account): Promise<Repo[]> {
    const repos: Repo[] = []
    for (let page = 1; page <= REPO_PAGES; page++) {
      const batch = await request<GhRepo[]>(
        account,
        `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`
      )
      for (const ghRepo of batch) {
        repos.push({
          id: ghRepo.full_name,
          accountId: account.id,
          name: ghRepo.full_name,
          defaultBranch: ghRepo.default_branch,
          webUrl: httpUrl(`${ghRepo.html_url}/actions`)
        })
      }
      if (batch.length < 100) {
        break
      }
    }
    return repos
  },

  async listPipelines(
    account: Account,
    repo: Repo,
    etag?: string | null
  ): Promise<PipelinesResult> {
    const {
      status,
      data,
      etag: newEtag,
      rateLimit
    } = await fetchJson<{ workflow_runs: GhRun[] }>(
      `${apiBase(account)}/repos/${repo.id}/actions/runs?per_page=${RUNS_PER_REPO}`,
      headers(account),
      { etag, rateLimitHeaders: RATE_LIMIT_HEADERS }
    )
    if (status === 304 || data === null) {
      return { pipelines: [], etag: etag ?? null, notModified: true, rateLimit }
    }

    const pipelines = pipelinesFromRuns(data.workflow_runs, repo.defaultBranch)
    return { pipelines, etag: newEtag, notModified: false, rateLimit }
  },

  async listOpenChanges(
    account: Account,
    repo: Repo,
    etag?: string | null
  ): Promise<OpenChangesResult> {
    const {
      status,
      data,
      etag: newEtag,
      rateLimit
    } = await fetchJson<GhPull[]>(
      `${apiBase(account)}/repos/${repo.id}/pulls?state=open&per_page=100`,
      headers(account),
      { etag, rateLimitHeaders: RATE_LIMIT_HEADERS }
    )
    if (status === 304 || data === null) {
      return { changes: [], etag: etag ?? null, notModified: true, rateLimit }
    }
    // Just the open-PR list — poll joins each one's status from the repo's runs (by head ref),
    // so there's no per-PR fetch.
    const changes: ChangeMeta[] = data.map((pull) => ({
      number: pull.number,
      title: pull.title,
      headRef: pull.head.ref,
      headSha: pull.head.sha,
      webUrl: httpUrl(pull.html_url),
      isDraft: pull.draft,
      isBot: pull.user?.type === 'Bot'
    }))
    return { changes, etag: newEtag, notModified: false, rateLimit }
  }
}
