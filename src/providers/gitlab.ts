import type {
  Account,
  Author,
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

const REPO_PAGES = 3 // up to 300 projects
// Enough recent pipelines to cover every active ref (default + open MR source branches) in one fetch.
const PIPELINES_PER_PROJECT = 100
const RATE_LIMIT_HEADERS: RateLimitHeaders = {
  remaining: 'ratelimit-remaining',
  reset: 'ratelimit-reset'
}

function apiBase(account: Account): string {
  return `${account.host.replace(/\/$/, '')}/api/v4`
}

async function request<T>(account: Account, path: string): Promise<T> {
  // Pass the rate-limit headers so a throttled response surfaces as a RateLimitError (accurate
  // reset time) rather than a generic failure that would mark the connection as a bad token.
  const { data } = await fetchJson<T>(
    `${apiBase(account)}${path}`,
    { 'PRIVATE-TOKEN': account.token },
    { rateLimitHeaders: RATE_LIMIT_HEADERS }
  )
  return data as T
}

interface GlCommit {
  title: string
}

interface GlUser {
  username: string
  name?: string
  avatar_url?: string
  web_url?: string
}

function glAuthor(user: GlUser | null | undefined): Author | undefined {
  return user
    ? {
        login: user.username,
        name: user.name,
        avatarUrl: user.avatar_url,
        profileUrl: user.web_url
      }
    : undefined
}

// GitLab's pipelines list has no commit message, so look it up by sha for the row tooltip. Cached
// per sha (transient, per worker activation) so the same commit isn't refetched across polls.
const commitTitleBySha = new Map<string, string>()

async function commitTitle(
  account: Account,
  projectId: string,
  sha: string
): Promise<string | null> {
  const cached = commitTitleBySha.get(sha)
  if (cached !== undefined) {
    return cached
  }
  try {
    const commit = await request<GlCommit>(
      account,
      `/projects/${projectId}/repository/commits/${sha}`
    )
    commitTitleBySha.set(sha, commit.title)
    return commit.title
  } catch {
    return null
  }
}

const pipelineAuthorById = new Map<string, Author | undefined>()

async function pipelineAuthor(
  account: Account,
  projectId: string,
  pipelineId: string
): Promise<Author | undefined> {
  const key = `${projectId}:${pipelineId}`
  if (pipelineAuthorById.has(key)) {
    return pipelineAuthorById.get(key)
  }
  try {
    const pipeline = await request<{ user: GlUser | null }>(
      account,
      `/projects/${projectId}/pipelines/${pipelineId}`
    )
    const author = glAuthor(pipeline.user)
    pipelineAuthorById.set(key, author)
    return author
  } catch {
    return undefined
  }
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
  created_at: string
}

interface GlMergeRequest {
  iid: number
  title: string
  draft: boolean
  web_url: string
  source_branch: string
  sha: string
  author: (GlUser & { bot?: boolean }) | null
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
      const batch = await request<GlProject[]>(
        account,
        `/projects?membership=true&simple=true&per_page=100&page=${page}&order_by=last_activity_at&min_access_level=20`
      )
      for (const project of batch) {
        repos.push({
          id: String(project.id),
          accountId: account.id,
          name: project.path_with_namespace,
          defaultBranch: project.default_branch ?? 'main',
          webUrl: httpUrl(`${project.web_url}/-/pipelines`)
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

    // Newest pipeline per ref, picked by id (monotonic). Not by list order: when a commit
    // supersedes a run GitLab cancels it, bumping its updated_at above the newer pending/running
    // run, so an updated_at-first dedup would keep the stale canceled one.
    const newestByRef = new Map<string, GlPipeline>()
    for (const pipeline of data) {
      const existing = newestByRef.get(pipeline.ref)
      if (!existing || pipeline.id > existing.id) {
        newestByRef.set(pipeline.ref, pipeline)
      }
    }
    const pipelines: Pipeline[] = [...newestByRef.values()].map((pipeline) => ({
      id: String(pipeline.id),
      ref: pipeline.ref,
      isDefaultBranch: pipeline.ref === repo.defaultBranch,
      status: mapGitlabStatus(pipeline.status),
      webUrl: httpUrl(pipeline.web_url),
      sha: pipeline.sha,
      title: `#${pipeline.id}`,
      updatedAt: pipeline.updated_at,
      startedAt: pipeline.created_at
    }))

    // Give the default-branch row a useful tooltip: the commit message, so a hover on a failing
    // main shows which commit broke it (GitHub already carries this; GitLab needs the lookup).
    const defaultPipeline = pipelines.find((pipeline) => pipeline.isDefaultBranch)
    if (defaultPipeline) {
      const title = await commitTitle(account, repo.id, defaultPipeline.sha)
      if (title) {
        defaultPipeline.title = title
      }
      defaultPipeline.attribution = await pipelineAuthor(account, repo.id, defaultPipeline.id)
    }

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
    } = await fetchJson<GlMergeRequest[]>(
      `${apiBase(account)}/projects/${repo.id}/merge_requests?state=opened&per_page=100`,
      { 'PRIVATE-TOKEN': account.token },
      { etag, rateLimitHeaders: RATE_LIMIT_HEADERS }
    )
    if (status === 304 || data === null) {
      return { changes: [], etag: etag ?? null, notModified: true, rateLimit }
    }
    // Just the open-MR list — poll joins each one's status from the project's pipelines (by head
    // sha, source branch, or MR ref), the same path GitHub uses.
    const changes: ChangeMeta[] = data.map((mr) => ({
      number: mr.iid,
      title: mr.title,
      headRef: mr.source_branch,
      headSha: mr.sha,
      webUrl: httpUrl(mr.web_url),
      isDraft: mr.draft,
      isBot: mr.author?.bot ?? false,
      attribution: glAuthor(mr.author)
    }))
    return { changes, etag: newEtag, notModified: false, rateLimit }
  }
}
