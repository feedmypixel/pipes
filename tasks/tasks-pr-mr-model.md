# Tasks: PR/MR-centric model

From `prd-pr-mr-model.md`. Switches the display unit from "live branch" to "open PR/MR",
removing `/branches` + the Contents:read requirement.

> **Parent tasks below. Sub-tasks are generated after a "Go".**

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

- [ ] 0.0 Create feature branch `feat/pr-mr-model`.
- [ ] 1.0 **Provider model** — `Change` type + `listOpenChanges` on the `Provider` interface; GitHub
      (`/pulls` → head SHA → checks) + GitLab (`/merge_requests` → head pipeline) adapters,
      ETag-conditional; include bot PRs; map to the shared status set. Retire `listBranches`.
- [ ] 2.0 **Snapshot + poll core** — new per-repo shape `{ default, changes }`; poll fetches default
      (runs API) + open changes; diff + first-sight-silent on `changes`; storage upgrade clears the
      old `snapshots`/`branchCache`. Keep single-flight, `fresh` foreground polling, rate back-off.
- [ ] 3.0 **Notifications** — a PR/MR check going failed notifies (links to that PR/run); recovery on
      green; default-branch failure unchanged. Badge = default branches failing (unchanged).
- [ ] 4.0 **UI** — RepoCard/RepoList: pinned default-branch row, open PRs below with number + title,
      drafts dimmed (no cap). Status-filter pills + collapse carry over. No provider brand marks.
- [ ] 5.0 **Token scopes + docs** — options token help + README: GitHub fine-grained
      **Pull requests: read** (+ Actions: read for default branch), GitLab `read_api`; drop
      Contents:read. Update health/validation messaging if it references branches.
- [ ] 6.0 **Tests** — provider `listOpenChanges` mapping (200 + 304), poll diff/notify over the new
      shape, storage upgrade clears old keys, RepoCard PR-row + dimmed-draft rendering.

## Notes

- Supersedes the `branch-model` backlog item and the current `status-view-model`.
- The just-shipped poll responsiveness (live branches every poll, `fresh` foreground) carries over —
  reuse the loop, only the per-repo fetch + shape change.
