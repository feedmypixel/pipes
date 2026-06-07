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
- [ ] 2.0 **Snapshot + poll core** — switch the shape; retire `listBranches`
  - [ ] 2.1 `storage.ts`: snapshot → `Record<repoId, { default: Pipeline | null, changes: Change[] }>`;
        drop `branchCache`; add `changeEtags`; `schemaVersion` key.
  - [ ] 2.2 upgrade: on a `schemaVersion` bump, clear `snapshots` + remove `branchCache`/`changeEtags`.
  - [ ] 2.3 `poll.ts`: `pollRepo` fetches default (runs API, pick the default-branch run) + `listOpenChanges`;
        build the new snapshot; ETags for both; fold both rate-limits into the floor.
  - [ ] 2.4 diff + first-sight-silent over `default` + each `change` (key by PR number); retire `keepLiveBranches`.
  - [ ] 2.5 badge = default branches failing (unchanged). Keep single-flight, `fresh`, back-off.
- [ ] 3.0 **Notifications** — `notify.ts` `notifyChangeFailed`/recovery (copy "PR #N check failed", links
      to the PR/run); default-branch failure unchanged; wire into the poll diff.
- [ ] 4.0 **UI**
  - [ ] 4.1 `group.ts`: reshape grouping/sort over `{ default, changes }` (pinned default + PR rows; rank by worst).
  - [ ] 4.2 `RepoCard.svelte`: pinned default row + PR rows (number + title), drafts dimmed.
  - [ ] 4.3 `RepoList` / popup / sidepanel: adapt to the new groups; status-filter over change statuses.
- [ ] 5.0 **Token scopes + docs** — options token help + README: GitHub fine-grained
      **Pull requests: read** (+ Actions: read for default branch), GitLab `read_api`; drop
      Contents:read. Update health/validation messaging if it references branches.
- [ ] 6.0 **Tests** — provider `listOpenChanges` mapping (200 + 304), poll diff/notify over the new
      shape, storage upgrade clears old keys, RepoCard PR-row + dimmed-draft rendering.

## Notes

- Supersedes the `branch-model` backlog item and the current `status-view-model`.
- The just-shipped poll responsiveness (live branches every poll, `fresh` foreground) carries over —
  reuse the loop, only the per-repo fetch + shape change.
