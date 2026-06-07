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

/** Result of a conditional pipeline fetch. */
export interface PipelinesResult {
  /** Latest pipeline per ref, newest first. Empty when notModified. */
  pipelines: Pipeline[]
  /** ETag to send next time (null if the provider gave none). */
  etag: string | null
  /** True on a 304 — caller should keep its cached snapshot. */
  notModified: boolean
  /** Rate-limit budget from the response, if the provider exposes it. */
  rateLimit: { remaining: number; reset: number } | null
}

/** Result of a conditional live-branches fetch. */
export interface BranchesResult {
  /** Names of branches that currently exist. Empty when notModified. */
  branches: string[]
  etag: string | null
  notModified: boolean
  rateLimit: { remaining: number; reset: number } | null
}

/** An open pull request / merge request with its head pipeline status. */
export interface Change {
  /** PR/MR number, e.g. 42. Stable identity for diffing. */
  number: number
  title: string
  /** Source branch name. */
  headRef: string
  /** Head commit SHA the status reflects. */
  headSha: string
  status: PipelineStatus
  /** Deep link to the PR/MR (its checks). */
  webUrl: string
  /** Draft / work-in-progress — shown dimmed. */
  isDraft: boolean
  /** Opened by a bot (Dependabot, Renovate, …). */
  isBot: boolean
}

/** Result of a conditional open-PR/MR fetch. */
export interface OpenChangesResult {
  /** Open PRs/MRs with head status. Empty when notModified. */
  changes: Change[]
  etag: string | null
  notModified: boolean
  rateLimit: { remaining: number; reset: number } | null
}

/**
 * One adapter per provider. Stateless: every call takes the account so the
 * service worker never has to hold provider instances across its short life.
 */
export interface Provider {
  validateToken(account: Account): Promise<ValidationResult>
  listRepos(account: Account): Promise<Repo[]>
  /**
   * Latest pipeline per ref, newest first. Pass the prior `etag` for a
   * conditional request; a 304 returns `notModified` with the same etag.
   */
  listPipelines(account: Account, repo: Repo, etag?: string | null): Promise<PipelinesResult>
  /**
   * Names of branches that currently exist, for dropping ghost refs (runs whose
   * branch was merged/deleted). Conditional via `etag`; a 304 returns notModified.
   */
  listBranches(account: Account, repo: Repo, etag?: string | null): Promise<BranchesResult>
  /**
   * Open PRs/MRs with their head pipeline status. Conditional via `etag`; a 304 returns
   * notModified. The unit of display in the PR/MR-centric model (see prd-pr-mr-model.md).
   */
  listOpenChanges(account: Account, repo: Repo, etag?: string | null): Promise<OpenChangesResult>
}
