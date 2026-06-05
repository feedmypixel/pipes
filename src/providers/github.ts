import type { Account, Pipeline, PipelineStatus, Provider, Repo, ValidationResult } from './types'

const SAAS_HOST = 'https://github.com'
const SAAS_API = 'https://api.github.com'
const REPO_PAGES = 3 // up to 300 repos
const RUNS_PER_REPO = 30

/** api.github.com for SaaS; {host}/api/v3 for GitHub Enterprise Server. */
function apiBase(account: Account): string {
  return account.host.replace(/\/$/, '') === SAAS_HOST
    ? SAAS_API
    : `${account.host.replace(/\/$/, '')}/api/v3`
}

async function request<T>(account: Account, path: string): Promise<T> {
  const res = await fetch(`${apiBase(account)}${path}`, {
    headers: {
      Authorization: `Bearer ${account.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${res.statusText} on ${path}`)
  }
  return res.json() as Promise<T>
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
  display_title: string
  id: number
}

export function mapGithubStatus(status: string | null, conclusion: string | null): PipelineStatus {
  if (status !== 'completed') {
    return status === 'in_progress' ? 'running' : 'pending'
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
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  },

  async listRepos(account: Account): Promise<Repo[]> {
    const repos: Repo[] = []
    for (let page = 1; page <= REPO_PAGES; page++) {
      const batch = await request<GhRepo[]>(
        account,
        `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`
      )
      for (const r of batch) {
        repos.push({
          id: r.full_name,
          accountId: account.id,
          name: r.full_name,
          defaultBranch: r.default_branch,
          webUrl: `${r.html_url}/actions`
        })
      }
      if (batch.length < 100) {
        break
      }
    }
    return repos
  },

  async listPipelines(account: Account, repo: Repo): Promise<Pipeline[]> {
    const runs = await request<{ workflow_runs: GhRun[] }>(
      account,
      `/repos/${repo.id}/actions/runs?per_page=${RUNS_PER_REPO}`
    )

    // Collapse to the newest run per ref. The API already returns newest first.
    const seen = new Set<string>()
    const pipelines: Pipeline[] = []
    for (const run of runs.workflow_runs) {
      const ref = run.head_branch ?? '(detached)'
      if (seen.has(ref)) {
        continue
      }
      seen.add(ref)
      pipelines.push({
        id: String(run.id),
        ref,
        isDefaultBranch: ref === repo.defaultBranch,
        status: mapGithubStatus(run.status, run.conclusion),
        webUrl: run.html_url,
        sha: run.head_sha,
        title: run.display_title,
        updatedAt: run.updated_at
      })
    }
    return pipelines
  }
}
