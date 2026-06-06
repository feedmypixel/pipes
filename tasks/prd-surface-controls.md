# PRD: Surface controls (sort, status filter, drop collapse)

## Introduction / Overview

Refines the popup + side-panel controls around how Pipes is actually used: watch **main**
(can I merge / its state) and **my branches** (the run I'm waiting on). The current per-repo
"show N more branches" collapse is awkward; the sort toggle is ambiguous. Replace both with a
clear sort + a status filter, and drop the collapse.

Driving insight: the surfaces are glanceable companions to the real value (notifications). Their
controls answer one question — _what's broken or am I waiting on?_

## Core model

- **Repos + their default-branch (main) always show.** Main is the headline (merge-readiness);
  it is never filtered away. An all-green repo still shows its green main line.
- **Branch rows (non-default) are governed by a status filter.** Toggling a state shows/hides
  those branch pipelines. This replaces the per-repo collapse — hide settled states and the
  noise is gone globally, no per-repo expanding.
- **Sort** orders repos (and branches within a repo).

## Goals

1. Clear **sort**: segmented `[ Name | Status ]`, default Name.
2. **Status filter** on branch rows, per-surface, persisted.
3. **Drop** the per-repo "show N more branches" collapse.
4. Keep the **popup lean**; give the **side panel** the fuller controls.

## Functional Requirements

1. **Sort — segmented control** `[ Name | Status ]` on the side panel (replaces the toggle):
   - **Name** (default): repos A-Z; branches A-Z within a repo.
   - **Status** (importance): failing → running → pending → settled/ok, at repo and branch level.
   - Popup stays minimal — keep Name order; no sort control (it's a glance).
2. **Status filter** (`failed / running / pending / success / canceled / skipped`) on branch
   rows:
   - **Side panel**: full per-state toggles; default all on.
   - **Popup**: one **"problems only"** toggle = show only `failed / running / pending` branch
     rows (hide settled). Default on (the popup is for "anything wrong?").
   - Per-surface, persisted in `localStorage` (panel-local view prefs).
3. **Drop collapse** — remove the per-repo "show N more branches" + `expanded` state from both
   surfaces. Branch rows that pass the filter render directly.
4. **Repos + main always render** regardless of filter; the filter only adds/removes branch
   rows.

## Non-Goals

- Filtering whole repos out by main status (main always shows).
- Sort/filter controls beyond these two.
- Touching the notification path.

## Technical Considerations

- Reuse `group.ts` (`groupByOwner` gives primary + branch lists; `sortGroups` for status). The
  filter applies to the `active` + `collapsed` branch lists (merge them, then filter by state)
  — `collapsed` as a concept goes away; it becomes "branches not passing the filter".
- A small pure `visibleBranches(view, allowedStates)` helper in `group.ts`, unit-tested.
- View prefs (sort, allowed states) in `localStorage` per surface; sensible defaults.
- Svelte 5 runes; tear-downs already handled.

## Success Metrics

- Side panel: segmented sort + per-state filter; popup: problems-only toggle; no collapse on
  either; main always visible. `pnpm check`/`lint`/`test` green; the filter/sort helpers tested;
  both surfaces screenshotted.

## Open Questions

1. Popup "problems only" default — on (focus) or off (see everything)? (Lean: on.)
2. Side-panel filter UI — a row of toggle chips vs a small popover. (Lean: inline chips; it has
   the room.)
