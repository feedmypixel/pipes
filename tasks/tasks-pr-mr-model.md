# Tasks: PR/MR-centric model

From `prd-pr-mr-model.md`. Switches the display unit from "live branch" to "open PR/MR",
removing `/branches` + the Contents:read requirement.

> Sub-tasks expanded. Executed one at a time, kept green per CLAUDE.md gates.

## Relevant files

- `src/providers/types.ts` — add `Change` + `Provider.listOpenChanges`; retire `listBranches`/`BranchesResult`.
- `src/providers/github.ts` — `/pulls?state=open` → head SHA → check-runs/status mapping.
- `src/providers/gitlab.ts` — `/merge_requests?state=opened` → head pipeline mapping.
- `src/providers/github.test.ts` · `gitlab.test.ts` — `listOpenChanges` mapping tests.
- `src/lib/storage.ts` — new snapshot shape `{ default, changes }`; drop `branchCache`; upgrade clears old keys.
- `src/background/poll.ts` · `poll-cycle.test.ts` — fetch changes, diff on `changes`, notify, badge.
- `src/lib/group.ts` · `group.test.ts` — grouping/sort over the new shape (pinned default + PR rows).
- `src/lib/components/RepoCard.svelte` · `RepoList.svelte` — pinned main, PR rows (number + title), dimmed drafts.
- `src/lib/notify.ts` — PR-check-failed copy + link target.
- `src/options/App.svelte` · `README.md` — token scopes (GitHub Pull requests: read; drop Contents:read).

## Tasks

- [x] 0.0 Create feature branch `feat/pr-mr-model`.
- [x] 1.0 **Provider model** (additive — `listBranches` kept until 2.0 switches over; stays green)
  - [x] 1.1 `types.ts`: add `Change` ({ number, title, headRef, headSha, status, webUrl, isDraft, isBot }) + `OpenChangesResult` ({ changes, etag, notModified, rateLimit }); add `listOpenChanges` to `Provider`.
  - [x] 1.2 `github.ts`: `listOpenChanges` — `/pulls?state=open&per_page=100` (ETag); per PR map head
        SHA via `/commits/{sha}/check-runs` (mapLimit), `isDraft`=pr.draft, `isBot`=user.type==='Bot'.
  - [x] 1.3 `gitlab.ts`: `listOpenChanges` — `/merge_requests?state=opened&per_page=100` (ETag);
        status from `head_pipeline`, `isDraft`=mr.draft, `isBot` from author.
  - [x] 1.4 Provider `listOpenChanges` tests (200 mapping, worst-status, bot/draft, 304) — github + gitlab.
- [x] 2.0 **Snapshot + poll core** — switch the shape; retire `listBranches`
  - [x] 2.1 `storage.ts`: snapshot → `Record<repoId, { default, changes }>`; drop `branchCache`; add `changeEtags`.
  - [x] 2.2 `migrate()` on a `schemaVersion` bump clears `snapshots`/`repoEtags`/`changeEtags`/`branchCache`; wired into the worker.
  - [x] 2.3 `poll.ts`: `pollRepo` fetches default (runs) + `listOpenChanges`; ETags for both; both rate-limits folded into the floor.
  - [x] 2.4 diff + first-sight-silent over `default` + each `change` (keyed by number); `keepLiveBranches` retired.
  - [x] 2.5 badge = default branches failing. Single-flight, `fresh`, back-off kept.
- [x] 3.0 **Notifications** — `notifyChangeFailed` (links to the PR/MR) + generic `notifyRecovered`;
      default-branch failure unchanged; wired into the poll diff.
- [x] 4.0 **UI**
  - [x] 4.1 `group.ts`: reshaped over `{ default, changes }` (pinned default + PR rows; rank by worst incl PRs).
  - [x] 4.2 `RepoCard.svelte` + new `ChangeRow.svelte`: pinned default row + PR rows (number + title), drafts dimmed.
  - [x] 4.3 RepoList/popup/sidepanel carry over unchanged (consume the same `OwnerGroup`s). Showcase updated.
- [x] 5.0 **Token scopes + docs** — options token help + README: GitHub **Actions/Pull requests/Checks: read**,
      GitLab `read_api`; Contents:read dropped.
- [~] 6.0 **Tests** — provider mapping ✅, poll diff/notify over the new shape ✅, storage migration ✅.
  _RepoCard PR-row + dimmed-draft browser test deferred (UI, low risk)._

## Notes

- Supersedes the `branch-model` backlog item and the current `status-view-model`.
- The just-shipped poll responsiveness (live branches every poll, `fresh` foreground) carries over —
  reuse the loop, only the per-repo fetch + shape change.
