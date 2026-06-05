/**
 * Normalized model shared across providers. GitHub and GitLab speak different
 * dialects; everything above this layer only ever sees these shapes.
 */

export type ProviderId = 'github' | 'gitlab'

/** The state we collapse every provider's many statuses into. */
export type PipelineStatus =
  | 'success'
  | 'failed'
  | 'running'
  | 'pending'
  | 'canceled'
  | 'skipped'
  | 'unknown'

/** Terminal states: a transition *into* one of these is worth a notification. */
export const TERMINAL_STATUSES: ReadonlySet<PipelineStatus> = new Set([
  'success',
  'failed',
  'canceled'
])

export interface Account {
  id: string
  provider: ProviderId
  /** User-facing name, e.g. "Work GitLab" or "personal". */
  label: string
  /** Origin the user signs in to, e.g. https://gitlab.com or https://github.com. */
  host: string
  /** Personal access token. GitLab: read_api. GitHub: read-only (Actions + repo metadata). */
  token: string
}

export interface Repo {
  /** Provider-native id as a string (GitLab numeric project id, GitHub "owner/name"). */
  id: string
  accountId: string
  /** Display name, e.g. "group/subgroup/project" or "owner/repo". */
  name: string
  defaultBranch: string
  /** Link to the repo's pipelines/actions page. */
  webUrl: string
}

export interface Pipeline {
  /** Provider-native id, stringified. */
  id: string
  /** Branch or tag the pipeline ran against. */
  ref: string
  isDefaultBranch: boolean
  status: PipelineStatus
  /** Deep link to the run/pipeline for diagnosis. */
  webUrl: string
  sha: string
  /** Commit message or workflow name, for display. */
  title: string
  /** ISO timestamp of last update. */
  updatedAt: string
}

export interface ValidationResult {
  ok: boolean
  /** Authenticated username, when ok. */
  user?: string
  /** Human-readable reason, when not ok. */
  error?: string
}

/**
 * One adapter per provider. Stateless: every call takes the account so the
 * service worker never has to hold provider instances across its short life.
 */
export interface Provider {
  validateToken(account: Account): Promise<ValidationResult>
  listRepos(account: Account): Promise<Repo[]>
  /** Latest pipeline per ref, newest first. */
  listPipelines(account: Account, repo: Repo): Promise<Pipeline[]>
}
