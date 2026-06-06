# PRD: Options surface

## Introduction / Overview

The options page (full tab, centred ~720px column) is where Pipes is configured: add
GitHub / GitLab connections (host + read-only token), pick repos to watch, and set
polling / notification preferences. Writing to `chrome.storage` here is what gives the
popup real data. Replaces the placeholder stub.

Authoritative design: `design/v1/README.md` (options section) + `assets/pipes.css`. Forms
follow the portal forms spec (field order, async availability, submit-never-disabled).

## Goals

1. Add / validate / remove **connections** (accounts) — host + token, provider auto-detected.
2. **Pick repos** to watch from the provider API.
3. Set **poll interval** + **notify-on-recovery**.
4. Persist to `chrome.storage` (`accounts`, `watchedRepos`, `settings`) so the popup and
   service worker react.

## User Stories

- I paste a host + read-only token, click **Validate**, and see it recognised + who I'm
  signed in as.
- I search my repos and tick the ones to watch.
- I set how often it polls and whether to notify when a pipeline recovers.

## Functional Requirements

1. **Layout** — centred ~720px column on the canvas; cards (surface, 1px border, 4px
   radius) with mono section headers.
2. **Connections list** — each active connection: status dot (ok/bad), label, host (mono),
   token state (`check` valid / `triangle-alert` expired), remove (`trash-2`). Empty state
   when none.
3. **Add a connection (form)** — fields in order label → hint → error → input → below;
   implicit-required, optional marked `(optional)`; errors inline above the input; submit
   never disabled (block via validation):
   - **Label** `(optional)`.
   - **Host** — hint "github.com, gitlab.com, or a self-hosted origin"; normalised to an origin.
   - **Personal access token** — hint "read-only scope; never synced, never logged"; Show/Hide toggle.
   - **Validate** — calls the provider; the `below` line (aria-live) shows the **auto-detected
     provider** + authed handle ("GitHub detected, signed in as @x"). No provider toggle.
   - Self-hosted origins: request host permission at runtime (`chrome.permissions.request`,
     user gesture) before validating; a permission note explains this.
   - Buttons: primary **Add connection** + secondary **Validate**.
4. **Watched repositories** — search field + a grouped (by account/owner) checkbox list
   pulled from the provider API (`listRepos`); tick to watch. Persists to `watchedRepos`.
5. **Settings** — poll-interval stepper (min 0.5 min) + notify-on-recovery toggle. Persists
   to `settings`.
6. **Security note** — tokens stay on device, read-only, never synced/logged.
7. **Save** — a sticky save row (primary "Save changes" + "All changes saved"); repos and
   settings may autosave (decide in tasks).
8. Reuse tokens + Lucide; scoped styles; spacing on the 4px rhythm.

## Non-Goals (Out of Scope)

- OAuth device flow (tokens are user-provided PATs).
- Editing an existing connection's token in place (remove + re-add for v1).
- The provider-incident banner.

## Technical Considerations

- **Provider detection**: `github.com` → github, `gitlab.com` → gitlab; a self-hosted origin
  is probed on Validate (try the GitHub `/user` then the GitLab `/user`). Extract a pure
  `providerFromHost` + `normaliseHost` and unit-test them.
- **Host permission**: `optional_host_permissions` covers `https://*/*`; request the specific
  origin via `chrome.permissions.request` on the add gesture.
- `validateToken` / `listRepos` already exist on the `Provider` interface.
- Svelte 5 runes; `chrome.storage` via `src/lib/storage.ts`.
- Dev preview: extend the dev-chrome shim to mock `validateToken` / `listRepos` so the form
  - repo picker render at the dev URL.

## Success Metrics

- A user can add a connection, validate it, pick repos, set preferences, and the popup then
  shows those repos. `pnpm check` / `pnpm lint` / `pnpm test` green; pure helpers tested.

## Open Questions

1. Save model: explicit Save row vs per-section autosave (lean autosave for repos/settings,
   explicit validate+add for the connection form).
