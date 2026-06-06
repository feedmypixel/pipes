# PRD: Side panel surface

## Introduction / Overview

The side panel is the **persistent companion** to the popup: the same owner-grouped pipeline
status, but always-open, denser, with controls and a **live** refresh while it's open. The
popup is a quick glance; the side panel is for keeping an eye on things while you work.
Replaces the current stub.

Authoritative visuals: reuse the popup's components + tokens (`StatusIcon`, `Row`, `RefChip`,
`RelativeTime`, `group.ts`). No new design bundle — denser variant of the popup treatment.

## Goals

1. A full-height, always-open status view: **sticky health summary** + owner-grouped rows.
2. **Controls** the popup lacks: filter, collapse/expand groups, sort.
3. **Live** while open: poll faster than the background alarm, with a "live" indicator.
4. Reuse popup components + the poll pipeline; no duplicated logic.

## User Stories

- I dock the side panel and watch my pipelines update live while I work.
- The top always tells me the headline: "2 failing on main" or "all green".
- I filter to one repo, or collapse owners I don't care about right now.
- A failing run is one click to open in a new tab.

## Functional Requirements

1. **Layout** — full-height panel (`chrome.sidePanel`). Sticky header: health summary
   (`N failing on main` / `all green`, reusing `countDefaultBranchFailures`) + a **live
   indicator** ("live · 10s" while actively polling, dimmed when idle/closed).
2. **Status list** — owner-grouped via `groupByOwner` + `Row` (reuse popup). Denser spacing;
   default-branch primary + branch rows. Vertical room means groups can show more than the
   popup's "show more" collapse.
3. **Controls**
   - **Filter** — a search box narrowing repos by name (reuse the matcher pattern).
   - **Collapse / expand groups** — per-owner toggle + an all-collapse/expand affordance.
   - **Sort** — by status (failing first) or name.
     **Depends on provider resilience** (ETag conditional requests + rate-limit/429 backoff;
     see `prd-provider-resilience.md`) — a naive 10s poll would blow GitHub's 5000/hr limit past
     ~12 watched repos. Build that first.

4. **Live poll while open** — on mount, message the service worker to `poll()` on a ~10s
   interval; clear on unmount. The worker stays the single owner of notifications + badge (no
   duplication). The background alarm (>=0.5 min) keeps running for when the panel is closed.
   Indicator reflects active vs background.
5. **Open run** — click a row → open its `webUrl` in a new tab (reuse `Row`).
6. **States** — empty (no watched repos → link to options), all-green, loading on first paint.
7. **Open mechanism** — toolbar action or a popup affordance opens the side panel
   (`chrome.sidePanel.open` on a user gesture; already stubbed in the popup).

## Non-Goals

- Settings / adding connections / repo picking — those stay in options.
- A second notification path — the worker owns notify + badge.
- Per-branch actions beyond open-in-tab.

## Technical Considerations

- **Active poll** = panel → `chrome.runtime.sendMessage({ type: 'poll' })` every ~10s while
  open; the worker's `onMessage` runs `poll()`. Panel reflects results via the existing
  `snapshots` storage subscription. Clear the interval + on unmount (`$effect` cleanup).
- The worker is ephemeral; a message wakes it. Register the `onMessage` listener synchronously
  at top level.
- Reuse `poll.ts` (`poll`, `countDefaultBranchFailures`), `group.ts`, and popup components.
  Denser is a styling variant (tokens), not new components where avoidable.
- `chrome.sidePanel` in the manifest (`side_panel.default_path`) + `sidePanel.open` on gesture.
- Svelte 5 runes; storage via `src/lib/storage.ts`. Tear down the interval + subscription in
  `$effect` cleanup.

## Success Metrics

- Side panel opens, shows live-updating owner-grouped status with a working summary, filter,
  collapse, and sort; one notification/badge path (worker). `pnpm check`/`lint`/`test` green;
  verified loaded-unpacked.

## Open Questions

1. Live interval: fixed 10s, or tied to a setting? (Lean: fixed 10s constant for v1.)
2. Sort persistence: remember the user's sort/collapse choices in storage, or reset per open?
   (Lean: remember in storage.)
