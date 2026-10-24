# PRD: No pipelines on a PR

## Introduction / Overview

Some repos only run CI on push to the default branch, so their open PRs/MRs have zero runs. Pipes
falls back to `unknown` for those PRs and draws the purple `?`, which reads as broken when nothing
is wrong.

This feature treats "no runs" as the **absence of a pipeline**, not a status, the same way the
default branch already shows "No pipelines yet". The PR row shows a hollow ring in the status slot.

Design contract: **`design/v7/NO-PIPELINES.md`** (+ `design/v7/Pipes - No pipelines on a PR.html`).

## Goals

1. A PR/MR with no runs never looks broken.
2. `unknown` keeps one meaning: the provider sent a status Pipes doesn't recognise.
3. No new filter chip, notification, or badge behaviour.

## User Stories

- As a user watching a repo that only runs CI on main, I want its open PRs to look settled, not
  alarming.
- As a user, I want the purple `?` to mean something genuinely odd happened.

## Functional Requirements

1. **Model.** `Change.status` is `PipelineStatus | null`. `null` means no run matched the PR/MR.
   `poll.ts` falls back to `null` (was `'unknown'`). No new `PipelineStatus` value.
2. **StatusIcon.** `status: null` renders a hollow ring: same size, transparent fill,
   `inset 0 0 0 1.5px var(--neutral)`, no glyph. `role="img"`, `aria-label` + tooltip
   "no pipelines".
3. **ChangeRow.** `data-status="none"` (no strip, no tint), still links to the PR/MR. Row label
   `#149 title on branch, no pipelines`. No run time; author shown as usual. Drafts stay dimmed.
4. **Filtering.** A `null` PR is visible only while every status chip is on (same predicate as
   "No pipelines yet"). Counts toward the repo PR count when visible; never toward failing counts or
   the badge.
5. **Notifications.** `null → failed` notifies like any other failure: if it failed, it has a
   pipeline (owner ruling 2026-10-24; the design had it silent). `null → success` is not a
   recovery. `X → null` is silent.
6. **Cache.** Bump `SCHEMA_VERSION` so stored `unknown` PRs are re-derived.
7. **Showcase.** Add a `status: null` PR row; keep an `unknown` row.

## Non-Goals (Out of Scope)

- Any change to the default-branch "No pipelines yet" line.
- Running CI on PRs in watched repos.
- A filter chip for "no pipelines".

## Design Considerations

- Labels stay in one place: `statusVisual(null)` returns the "no pipelines" visual.
- `--neutral` stroke meets 3:1 non-text contrast in both themes (per the design note); do not
  substitute `--border-2` or `--text-3`.
- Static, so nothing to gate on reduced motion.

## Technical Considerations

- The "every chip on" predicate is shared between `noPipelinesVisible` and `visibleChanges`.
- A runs 304 leaves nothing to join a newly opened PR/MR to, which would wrongly show "no
  pipelines" for a branch that already has a run. When the open list has a number not in the last
  snapshot, the poll refetches the runs without the ETag (one extra request, only then).

## Success Metrics

- stat-ui's PRs (no PR workflow) show the ring, not `?`, after one poll.

## Open Questions

None. The design settled all four questions.
