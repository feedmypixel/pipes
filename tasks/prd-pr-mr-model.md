# PRD: PR/MR-centric model

> Status: **finalized.** Open questions resolved (see Decisions). Task list: `tasks-pr-mr-model.md`.

## Why

Today Pipes shows, per repo, the default branch plus every live non-default branch that has a
pipeline run. That model caused a long tail of pain:

- **Ghosts.** GitHub keeps Actions runs after a branch is deleted, so merged/abandoned branches
  linger. We bolted on a `/branches` intersection to filter them — which needs `Contents: read`,
  added a 10-min staleness lag, and a sticky `unavailable` cache that needed a reinstall to clear.
- **Noise.** A feature branch with no open PR is rarely something you are actively trying to land.

A branch you care about is, in practice, a branch with an **open PR/MR**. Switching the unit of
display from "live branch" to "open PR/MR" fixes the root cause instead of patching symptoms.

## What changes

Per repo, show:

1. **Default branch** — always, polled from the runs/pipelines API (the "is main green" headline).
   Unchanged from today.
2. **Open PRs / MRs** — each with its head pipeline status. Merged/closed PRs drop off
   automatically (they are no longer "open"), so ghosts are structurally impossible.

`/branches` is removed entirely.

## Benefits

- **No ghosts, no `/branches`, no Contents:read.** GitHub fine-grained token needs
  `Pull requests: read` instead; GitLab MRs are already covered by `read_api`. Simpler token story
  and it sidesteps the whole permission saga.
- **Live + relevant.** Open PRs are inherently current; new PRs appear on the next poll.
- **Actionable.** A PR/MR pipeline status is exactly what gates the merge.

## User stories

- As a developer, I see my open PRs and whether their checks pass, so I know what is safe to merge.
- As a developer, I am loudly notified when an open PR check fails, and clicking the notification
  opens that PR check run.
- As a developer, I still see at a glance whether each repo default branch is green.
- As a developer, draft PRs are visually de-emphasised so they do not distract.

## Functional requirements (high level)

1. Provider interface gains `listOpenChanges(account, repo, etag?)` returning, per open PR/MR:
   `{ number, title, headRef, headSha, status, webUrl, isDraft, author? }`. ETag-conditional.
2. **GitHub adapter:** `GET /repos/{id}/pulls?state=open` → for each PR map `head.sha` to status via
   check-runs (or the combined status API). Map to the shared `PipelineStatus`.
3. **GitLab adapter:** `GET /projects/{id}/merge_requests?state=opened` → each MR head pipeline
   status.
4. Default-branch status keeps using the existing `listPipelines` path.
5. Snapshot shape per repo becomes `{ default: Pipeline | null, changes: Change[] }` (or equivalent),
   replacing the flat per-ref list. Diffing + notifications operate on `changes`.
6. Notifications: a PR/MR check transition to failed notifies (actionable, links to the run/PR);
   default-branch failure keeps today loud notification. Recovery notifications as today.
7. Token copy + README updated: GitHub `Pull requests: read` (+ Actions: read for default branch),
   GitLab `read_api`. Drop the Contents:read requirement.
8. UI (RepoCard / RepoList): default branch row pinned; open PRs listed below with PR number + title;
   drafts dimmed. Status filter pills + collapse behaviour carry over.

## Non-goals

- Trunk-based pushes with no PR keep only default-branch visibility (acceptable — main is the
  headline). No per-arbitrary-branch view returns.
- No PR review state, comments, or merge actions — status only.

## Decisions

- **Draft PRs:** shown but **dimmed** (lower contrast). Still see their CI; they don't shout.
- **Bot PRs (Dependabot, Renovate):** **included** — they have CI like any other PR.
- **Many open PRs:** **show all**, no per-repo cap. Rate cost is `/pulls` (1) + one status call per
  open PR; bounded by open-PR count, and the existing back-off pauses before exhaustion.
- **Default branch:** kept as its **own pinned row** via the runs API (the "is main green"
  headline), PRs listed below. Least churn; preserves the headline.
- **Migration:** on upgrade, **clear the old `snapshots` + `branchCache`** (shape changes). First
  poll reseeds; no notification storm because first-sight seeds silently.

## Technical notes

- This reshapes the `Provider` interface and the snapshot/diff core — it supersedes the current
  `status-view-model` and the `branch-model` backlog item.
- Build behind the existing poll loop; reuse the rate-limit back-off, `fresh`-foreground polling,
  and single-flight already in place.
