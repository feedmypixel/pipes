# PRD: Repo picker flow

## Introduction / Overview

Reworks how a user goes from a **connection** to **watched repositories**. The options
surface shipped with a manual **"Load repositories"** button and groups repos under the
connection's freeform **label** (e.g. "personal"), which reads as a confusing category and
hides a real gap: **available repos are never cached** — only `watchedRepos` is persisted, so
reopening options shows an empty list until the button is pressed.

This PRD makes the flow self-explanatory: **connections → available repos → watched repos**.
Adding a connection makes its repos available automatically; they appear grouped by **owner**
(the org/user the token can see), the user searches and ticks the ones to watch. The button
stops being a primary call-to-action.

Supersedes **FR#4** ("Watched repositories") and refines **FR#2** ("Connections list") of
`prd-options.md`. Authoritative visuals: existing options surface + `design/v2` tokens.

## Goals

1. **No manual load step.** Repos become available the moment a connection is added, and are
   already present on reopening options (cached).
2. **Owner-grouped, not label-grouped.** Group available + watched repos by provider + owner
   (`github.com / feedmypixel`), not the freeform connection label.
3. **Clear three-stage model** the UI reads top-to-bottom: connection → available → watched.
4. **Honest states** — loading, empty, error+retry, partial-scope — instead of a button that
   hides them.

## User Stories

- I add a GitHub connection; its repos appear under a `github.com / feedmypixel` group without
  me pressing anything.
- I reopen options the next day and my repos are still listed (cached), not blank.
- I search a long repo list and tick the few I want to watch.
- A connection token can't see one of my orgs; I'm told that org needs access, not shown a
  silent gap.

## Functional Requirements

1. **Auto-fetch on add.** Adding + validating a connection fetches its repos and **caches**
   them. (`addConnection` already calls `loadRepos`; the missing half is persistence.)

2. **Cache available repos.** Persist fetched repos per connection in `chrome.storage`
   (`availableRepos`, keyed by `accountId`). On options open, render from cache immediately;
   refresh in the background. This is what removes the need for the button.

3. **Demote the button.** Replace the primary **"Load repositories"** with a small, secondary
   **refresh** affordance (`↻`) per group — repos do change over time, so refresh stays, but
   it is no longer how you first see them. Refresh shows a spinner, not an empty→full jump.

4. **Group by owner, not label.** Group header = **provider host + owner**
   (`github.com / feedmypixel`, `github.com / whiskyinvestdirect`), derived from the API
   (the authed handle + each repo's owner), matching the popup's group-by-owner. The
   connection **label** is demoted to an optional secondary tag on the connection row, not a
   repo-group heading. A single token spanning personal + multiple orgs yields **one group per
   owner**.

5. **Search filters the cached list.** The existing filter field narrows the available repos
   client-side. (Volume strategy — see Technical.)

6. **Watch toggle.** Ticking an available repo promotes it into `watchedRepos` (persisted);
   unticking removes it. Available list is the cache; watched list is the persisted subset.

7. **States.**
   - **Loading** — skeleton / spinner while the first fetch (or a refresh) runs.
   - **Empty** — "No repositories found" when the token sees none.
   - **Error + retry** — "Couldn't reach github.com" with a retry, on fetch failure.
   - **Partial scope** — when the token lacks access to an org it should see, surface
     "Some organisations need access" rather than omitting them silently.

8. **Remove-connection** drops that connection's cached available + watched repos (the existing
   undo-toast already restores watched; extend it to restore the cache too).

## Non-Goals (Out of Scope)

- Server-side repo search as the primary mechanism (revisit only if client-filter doesn't
  scale — see Technical).
- Per-repo branch selection (watch is whole-repo; default-branch focus stays).
- Re-syncing on a schedule in the background worker (refresh is user-initiated + on-open).
- The token-expiry warning banner (parked in `hardening-backlog.md`).

## Technical Considerations

- **Volume + rate limits.** A token can see hundreds of repos. GitHub `/user/repos` and
  GitLab `/projects` paginate (100/page). **Decision (lean):** fetch all accessible repos
  (follow pagination), cache, and **filter client-side** — simplest, works for the low-hundreds
  case. If a user genuinely has thousands, revisit server search. **Log / surface** any cap
  rather than silently truncating.
- **Cache shape.** `availableRepos: Record<accountId, Repo[]>` in `chrome.storage.local`, via
  `src/lib/storage.ts` (no direct `chrome.storage` elsewhere). `Repo` already carries
  `accountId` + owner-derivable `name`.
- **Owner derivation.** `Repo.name` is `owner/repo`; group key = the owner segment. The authed
  handle (already fetched on Validate) seeds the personal group.
- **Dev preview.** Extend the dev-chrome mock so the cached + grouped list renders at the dev
  URL across multiple owners (it already returns multi-owner repos).
- **Reuse** the existing repo-row + checkbox + group styles; spacing on the 4px rhythm.

## Success Metrics

- Adding a connection lists its repos with **no button press**; reopening options shows them
  from cache. Groups read as `host / owner`. Loading / empty / error states are reachable.
  `pnpm check` / `pnpm lint` / `pnpm test` green; owner-grouping + cache helpers unit-tested.

## Open Questions

1. **Refresh placement** — per-group `↻` vs one refresh for the whole section? (Lean per-group,
   since each connection refreshes independently.)
2. **Cache staleness** — refresh only on user action + on-open, or also opportunistically when
   the popup is opened? (Lean on-open + manual for v1.)
3. **Stale-while-revalidate** — show cached repos instantly and quietly reconcile, or block on
   the refresh? (Lean show-cached-immediately, reconcile in background.)
