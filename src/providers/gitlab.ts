import type { Account, Pipeline, PipelineStatus, Provider, Repo, ValidationResult } from './types'

const REPO_PAGES = 3 // up to 300 projects
const PIPELINES_PER_PROJECT = 30

function apiBase(account: Account): string {
  return `${account.host.replace(/\/$/, '')}/api/v4`
}

async function request<T>(account: Account, path: string): Promise<T> {
  const res = await fetch(`${apiBase(account)}${path}`, {
    headers: { 'PRIVATE-TOKEN': account.token }
  })
  if (!res.ok) {
    throw new Error(`GitLab API ${res.status} ${res.statusText} on ${path}`)
  }
  return res.json() as Promise<T>
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

  async listPipelines(account: Account, repo: Repo): Promise<Pipeline[]> {
    const list = await request<GlPipeline[]>(
      account,
      `/projects/${repo.id}/pipelines?order_by=updated_at&sort=desc&per_page=${PIPELINES_PER_PROJECT}`
    )

    // Newest pipeline per ref. The API already returns newest first.
    const seen = new Set<string>()
    const pipelines: Pipeline[] = []
    for (const p of list) {
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
    return pipelines
  }
}
