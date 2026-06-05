# PRD: Popup surface

## Introduction / Overview

The popup is the **glance** surface: the toolbar dropdown (380px wide) that shows
pipeline status across watched repos at a glance, loud the moment a default branch
breaks. It composes the foundation primitives (`Row`, `StatusIcon`, `RefChip`,
`RelativeTime`), reading live from `chrome.storage`. It replaces the placeholder stub.

Authoritative design: `design/v1/README.md` (popup section), `screenshots/01-popup.png`,
`assets/pipes.css`.

## Goals

1. Show watched repos **grouped by owner**, live from storage `snapshots`.
2. **Headline default-branch failures** (alarm strip + headline rows).
3. Header actions: refresh, open side panel, open options.
4. Handle the empty / unconfigured / healthy states cleanly.

## User Stories

- As a user, I click the toolbar icon and instantly see which pipelines are red,
  grouped by owner, with `main` failures loudest.
- As a user, clicking a row opens that exact pipeline in a new tab.
- As a user with nothing set up, I see a clear "open setup" call to action.

## Functional Requirements

1. Read `accounts`, `watchedRepos`, `settings`, `snapshots` via `src/lib/storage.ts`;
   **subscribe** to `snapshots` for live updates; tear the subscription down on unmount.
2. **Header** (dark app-bar): green-tick logo + "Pipes" wordmark; right-aligned icon
   buttons (Lucide): `refresh-cw` (sends `{type:'poll-now'}` to the service worker),
   `panel-right` (`chrome.sidePanel.open({windowId})` on click), `settings`
   (`chrome.runtime.openOptionsPage()`).
3. **Group** repos by owner (owner = first segment of `repo.name`); owners A–Z, repos
   A–Z within. Per repo, show the **default-branch** pipeline as the primary `Row`;
   collapse other refs under a "Show N other branches" toggle (`chevron-down`).
4. **Owner header**: mono lowercase owner + a count chip.
5. **Alarm strip**: when ≥1 default-branch pipeline is `failed`, a red-tinted strip with
   a pulsing dot + "N failing on `main`" + a "jump" link to the first failing row.
6. **Rows**: reuse `Row`; whole-row deep link; failed-on-default = headline tint.
7. **Footer**: a live indicator (spinning ring) + "updated <relative>".
8. **States**: `unconfigured` (no accounts → empty state + "Open setup" CTA →
   `openOptionsPage`); `healthy` (all green → a subtle "all clear" note).
9. Width **380px**; body scrolls beyond ~560px.
10. Reuse tokens + primitives; scoped styles; the only `chrome.*` calls live in the
    popup's own action handlers (components stay presentational).

## Non-Goals (Out of Scope)

- Provider-incident banner (needs incident detection — hardening/later).
- The decorative vertical "pipe rail" (polish — later).
- Side panel + options surfaces (own PRDs).
- Deep-link to the specific failed **job line** (`Row` links to `pipeline.webUrl`;
  job-line targeting is a provider enhancement — later).
- A detailed per-repo error UI (minimal for v1).

## Technical Considerations

- Svelte 5 runes; storage subscribe inside `$effect` with cleanup.
- `chrome.sidePanel.open` must run on the popup button's click (a user gesture) — works.
- Owner/name derivation: `repo.name` is `owner/repo` or `group/.../project`; owner = first
  segment, display name = the remainder.
- Extract the **pure** grouping/sort logic (snapshots + repos → owners → repos → primary +
  others) into a testable module; unit-test it.

## Success Metrics

- Popup renders grouped, sorted rows from seeded storage; the alarm strip appears when a
  default branch is red; the header actions work; `unconfigured` shows the CTA.
- `pnpm check` / `pnpm lint` / `pnpm test` green; grouping logic unit-tested.

## Open Questions

1. Healthy / error visuals — keep minimal in v1, refine once dogfooded.
