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
import { fetchJson, httpUrl, type RateLimitHeaders } from './http'
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
  const { data } = await fetchJson<T>(`${apiBase(account)}${path}`, headers(account))
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

export const github: Provider = {
  async validateToken(account: Account): Promise<ValidationResult> {
    try {
      const user = await request<{ login: string }>(account, '/user')
      return { ok: true, user: user.login }
    } catch (error) {
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

    // Newest run per ref by updated_at (don't trust list order across workflows), newest first.
    const newestByRef = new Map<string, GhRun>()
    for (const run of data.workflow_runs) {
      const ref = run.head_branch ?? '(detached)'
      const existing = newestByRef.get(ref)
      if (!existing || run.updated_at > existing.updated_at) {
        newestByRef.set(ref, run)
      }
    }
    const pipelines: Pipeline[] = [...newestByRef.values()]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((run) => {
        const ref = run.head_branch ?? '(detached)'
        return {
          id: String(run.id),
          ref,
          isDefaultBranch: ref === repo.defaultBranch,
          status: mapGithubStatus(run.status, run.conclusion),
          webUrl: httpUrl(run.html_url),
          sha: run.head_sha,
          title: run.display_title,
          updatedAt: run.updated_at,
          startedAt: run.run_started_at
        }
      })
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
