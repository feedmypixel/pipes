# PRD: Surface UX pass

Consolidated from a live review of the popup / side panel / options. One coordinated pass so
the row-model rework and the polish land together, not piecemeal. Core value reminder:
notifications; the surfaces are glanceable companions. See `status-view-model` memory.

## 1. Row model (popup + side panel)

Status is **separate from the repo name**.

```
<owner / org>
<repo name>                 drawer header — no status icon, vertically centred, underlined link
  main      <status> <updated>     PINNED: always visible, even when collapsed
  <branch>  <status> <updated>     collapsible — the chevron hides/shows these
  <branch>  <status> <updated>
```

- Chevron toggle collapses **only the non-main branches**; repo-name row + main stay visible.
  Chevron uses the toast-close round hover.
- Repo with only a default branch renders the same (no extra branches under main).
- Tighter indent now the repo name has no icon.

## 2. Global readout (top)

Headline count + a **linkable failures list** (`repo · branch` lines that scroll/link to the
row), like `FormSummary`. The first thing a user checks for failures.

## 3. Controls

- **Toggle/filter pills**: tighter spacing between pills; selected style = the sort buttons
  (background + text colour); a **"toggle all"** link to the right.
- **Popup**: same pill styles as the side panel; sort controls on a **2nd line** with a
  separator + margin between buttons.
- **Sort**: (still to simplify — see open question; current `[Name | Status]` is the baseline.)

## 4. Interaction

- **Drop** the hover open-in-tab icon on rows; **underline** the repo/branch name as the link
  (click → opens the run/repo).

## 5. Live + footer

- **Live indicator** = the pulsing dot (not the spinner ring).
- **Side panel** needs the "updated … ago" footer (the popup has it).

## 6. Connection UX (options)

- **Validate** → a clear **success banner** ("validated, signed in as @x"), then prompt
  **"Add this connection?"** → on add, a **success toast/banner**. (Today it's just tiny text.)
- **Remove connection** → a toast/banner.
- **Watch / unwatch a repo** → a toast ("Watching x" / "No longer watching x").
- **Settings changes** (poll interval, notify) → success feedback (banner/toast) consistently.

## 7. Empty state (no connections)

- Drop the trailing full stop on "Add a GitHub or GitLab account to start watching pipelines".
- CTA label → **"Settings"** (was "Open setup").
- Footer should **not** say "updated just now" with no connection — show **"Waiting for
  connection"** with an appropriate icon/colour.
- Top icons on the empty state: refresh does nothing + settings just closes the popup → only
  the side-panel button is meaningful. **Hide/disable refresh + settings until configured**, or
  make them clearly do something.

## Showcase

Keep the showcase in step. It only comes "for free" when the shared chrome (toggle/filter
pills, segmented sort, drawer toggle, global readout) is a **component**, not surface-scoped
CSS. So prefer componentising these as part of this pass (ties to the shared-surface-chrome
backlog item) — then the showcase renders them automatically. Otherwise add showcase coverage
explicitly. (Disabled submit button: already in the showcase Buttons section — verify it's
shown.)

## Non-Goals

- The notification pipeline (separate; the real value, polished at release).
- Re-litigating the data model (settled in `status-view-model`).

## Open Questions

1. Sort control — keep `[Name | Status]`, or simplify further (drop direction)? (Parked.)

## Done already

- Storage shape guard fixed the add-after-remove crash + tests (PR #15).
