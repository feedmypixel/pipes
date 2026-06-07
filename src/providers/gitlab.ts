import type {
  Account,
  BranchesResult,
  Change,
  OpenChangesResult,
  Pipeline,
  PipelineStatus,
  PipelinesResult,
  Provider,
  Repo,
  ValidationResult
} from './types'
import { fetchJson, type RateLimitHeaders } from './http'

const REPO_PAGES = 3 // up to 300 projects
const PIPELINES_PER_PROJECT = 30
const RATE_LIMIT_HEADERS: RateLimitHeaders = {
  remaining: 'ratelimit-remaining',
  reset: 'ratelimit-reset'
}

function apiBase(account: Account): string {
  return `${account.host.replace(/\/$/, '')}/api/v4`
}

async function request<T>(account: Account, path: string): Promise<T> {
  const { data } = await fetchJson<T>(`${apiBase(account)}${path}`, {
    'PRIVATE-TOKEN': account.token
  })
  return data as T
}

interface GlProject {
  id: number
  path_with_namespace: string
  default_branch: string | null
  web_url: string
}

interface GlPipeline {
  id: number
  status: string
  ref: string
  sha: string
  web_url: string
  updated_at: string
}

interface GlMergeRequest {
  iid: number
  title: string
  draft: boolean
  web_url: string
  source_branch: string
  sha: string
  author: { bot?: boolean } | null
  head_pipeline: { status: string } | null
}

export function mapGitlabStatus(status: string): PipelineStatus {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'failed'
    case 'canceled':
      return 'canceled'
    case 'skipped':
      return 'skipped'
    case 'running':
      return 'running'
    case 'created':
    case 'waiting_for_resource':
    case 'preparing':
    case 'pending':
    case 'scheduled':
    case 'manual':
      return 'pending'
    default:
      return 'unknown'
  }
}

export const gitlab: Provider = {
  async validateToken(account: Account): Promise<ValidationResult> {
    try {
      const user = await request<{ username: string }>(account, '/user')
      return { ok: true, user: user.username }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  },

  async listRepos(account: Account): Promise<Repo[]> {
    const repos: Repo[] = []
    for (let page = 1; page <= REPO_PAGES; page++) {
      const batch = await request<GlProject[]>(
        account,
        `/projects?membership=true&simple=true&per_page=100&page=${page}&order_by=last_activity_at&min_access_level=20`
      )
      for (const p of batch) {
        repos.push({
          id: String(p.id),
          accountId: account.id,
          name: p.path_with_namespace,
          defaultBranch: p.default_branch ?? 'main',
          webUrl: `${p.web_url}/-/pipelines`
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
    } = await fetchJson<GlPipeline[]>(
      `${apiBase(account)}/projects/${repo.id}/pipelines?order_by=updated_at&sort=desc&per_page=${PIPELINES_PER_PROJECT}`,
      { 'PRIVATE-TOKEN': account.token },
      { etag, rateLimitHeaders: RATE_LIMIT_HEADERS }
    )
    if (status === 304 || data === null) {
      return { pipelines: [], etag: etag ?? null, notModified: true, rateLimit }
    }

    // Newest pipeline per ref. The API already returns newest first.
    const seen = new Set<string>()
    const pipelines: Pipeline[] = []
    for (const p of data) {
      if (seen.has(p.ref)) {
        continue
      }
      seen.add(p.ref)
      pipelines.push({
        id: String(p.id),
        ref: p.ref,
        isDefaultBranch: p.ref === repo.defaultBranch,
        status: mapGitlabStatus(p.status),
        webUrl: p.web_url,
        sha: p.sha,
        title: `#${p.id}`,
        updatedAt: p.updated_at
      })
    }
    return { pipelines, etag: newEtag, notModified: false, rateLimit }
  },

  async listBranches(account: Account, repo: Repo, etag?: string | null): Promise<BranchesResult> {
    const {
      status,
      data,
      etag: newEtag,
      rateLimit
    } = await fetchJson<{ name: string }[]>(
      `${apiBase(account)}/projects/${repo.id}/repository/branches?per_page=100`,
      { 'PRIVATE-TOKEN': account.token },
      { etag, rateLimitHeaders: RATE_LIMIT_HEADERS }
    )
    if (status === 304 || data === null) {
      return { branches: [], etag: etag ?? null, notModified: true, rateLimit }
    }
    return { branches: data.map((b) => b.name), etag: newEtag, notModified: false, rateLimit }
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
    } = await fetchJson<GlMergeRequest[]>(
      `${apiBase(account)}/projects/${repo.id}/merge_requests?state=opened&per_page=100`,
      { 'PRIVATE-TOKEN': account.token },
      { etag, rateLimitHeaders: RATE_LIMIT_HEADERS }
    )
    if (status === 304 || data === null) {
      return { changes: [], etag: etag ?? null, notModified: true, rateLimit }
    }
    const changes: Change[] = data.map((mr) => ({
      number: mr.iid,
      title: mr.title,
      headRef: mr.source_branch,
      headSha: mr.sha,
      // The MR carries its head pipeline inline — no per-MR fan-out needed.
      status: mr.head_pipeline ? mapGitlabStatus(mr.head_pipeline.status) : 'unknown',
      webUrl: mr.web_url,
      isDraft: mr.draft,
      isBot: mr.author?.bot ?? false
    }))
    return { changes, etag: newEtag, notModified: false, rateLimit }
  }
}
