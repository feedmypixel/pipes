/**
 * Normalized model shared across providers. GitHub and GitLab speak different
 * dialects; everything above this layer only ever sees these shapes.
 */

import type { RateLimit } from './http'

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
  /** ISO start time, for a live "running Xm" while in progress. */
  startedAt?: string
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
  rateLimit: RateLimit | null
}

/** An open pull request / merge request with its head pipeline status. */
export interface Change {
  /** PR/MR number, e.g. 42. Stable identity for diffing. */
  number: number
  title: string
  /** Source branch name — how poll joins the PR to its pipeline status. */
  headRef: string
  /** Head commit SHA the status reflects. */
  headSha: string
  status: PipelineStatus
  /** ISO time of the head pipeline run, joined from the runs list. Undefined when none matched. */
  updatedAt?: string
  /** ISO start time of the head pipeline, for a live "running Xm". Undefined when none matched. */
  startedAt?: string
  /** Deep link to the PR/MR (its checks). */
  webUrl: string
  /** Draft / work-in-progress — shown dimmed. */
  isDraft: boolean
  /** Opened by a bot (Dependabot, Renovate, …). */
  isBot: boolean
}

/**
 * Open-PR/MR metadata. Providers return just the list; poll joins each one's status + time from
 * the repo's pipelines (by head ref) — one shared runs fetch, no per-PR fan-out.
 */
export type ChangeMeta = Omit<Change, 'status' | 'updatedAt' | 'startedAt'>

/** Result of a conditional open-PR/MR fetch (metadata only — status is joined in poll). */
export interface OpenChangesResult {
  /** Open PRs/MRs (no status). Empty when notModified. */
  changes: ChangeMeta[]
  etag: string | null
  notModified: boolean
  rateLimit: RateLimit | null
}

/**
 * One adapter per provider. Stateless: every call takes the account so the
 * service worker never has to hold provider instances across its short life.
 */
export interface Provider {
  validateToken(account: Account): Promise<ValidationResult>
  listRepos(account: Account): Promise<Repo[]>
  /**
   * Newest pipeline per ref (default branch + every active branch incl. PR heads). Pass the prior
   * `etag` for a conditional request; a 304 returns `notModified`. Poll reads the default branch
   * here and joins each open PR/MR's status by head ref.
   */
  listPipelines(account: Account, repo: Repo, etag?: string | null): Promise<PipelinesResult>
  /**
   * Open PRs/MRs (metadata only — status is joined from listPipelines by head ref). Conditional
   * via `etag`. The unit of display in the PR/MR-centric model (see prd-pr-mr-model.md).
   */
  listOpenChanges(account: Account, repo: Repo, etag?: string | null): Promise<OpenChangesResult>
}
