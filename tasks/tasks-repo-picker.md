# Tasks: Repo-picker flow

From `tasks/prd-repo-picker.md`. Reworks options' watched-repos to
connections → available (cached) → watched: auto-fetch + cache, owner grouping,
demote the "Load repositories" button, honest states. Supersedes options FR#4.

## Tasks

- [x] 0.0 Create feature branch
- [x] 1.0 Storage — persist available repos
  - [x] 1.1 Add `availableRepos: Record<string, Repo[]>` (keyed by accountId) to `StorageShape` + default `{}`
  - [x] 1.2 Confirm `get`/`set`/`subscribe` cover the new key (generic — should already)
- [x] 2.0 Owner grouping for available repos
  - [x] 2.1 Reuse `src/lib/group.ts` `splitName`/owner logic; add a lean `groupReposByOwner(repos)`
        (no snapshots — picker doesn't need pipeline state) returning `{ owner, repos }[]` A-Z
  - [x] 2.2 Unit tests (multi-owner, single, empty)
- [x] 3.0 Auto-fetch + cache; demote the button
  - [x] 3.1 `addConnection` success → fetch → write `availableRepos[accountId]`
  - [x] 3.2 On options open: render from cached `availableRepos`; kick a background refresh per
        connection (stale-while-revalidate — show cache, reconcile quietly)
  - [x] 3.3 Replace primary "Load repositories" with a small per-group **refresh** icon button
        (spinner while refreshing); only show the big empty/error states when there's no cache
- [x] 4.0 Owner-grouped picker UI
  - [x] 4.1 Render available repos grouped by `host / owner` headers (across connections)
  - [x] 4.2 Search filters the cached list (existing filter input)
  - [x] 4.3 Watch toggle ↔ `watchedRepos` (existing `toggleRepo`)
  - [x] 4.4 Demote connection label → secondary tag on the connection row (not a group heading)
- [x] 5.0 States
  - [x] 5.1 Loading (spinner) on first fetch / refresh
  - [x] 5.2 Empty — "No repositories found"
  - [x] 5.3 Error + retry — "Couldn't reach {host}" with a retry button
  - [~] 5.4 Partial-scope note — DEFERRED: no reliable provider signal to detect "org needs
    approval" (the API just omits inaccessible orgs); revisit if a signal appears
- [x] 6.0 Remove-connection drops cached + watched; extend the undo toast to restore the cache
- [x] 7.0 Dev-chrome multi-owner mock + tests (grouping + cache helpers); verify in options,
      light + dark
