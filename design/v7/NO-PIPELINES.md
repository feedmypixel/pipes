# Pipes — open PR/MR with no pipelines

Companion to `README.md`. Visual reference: **`Pipes - No pipelines on a PR.html`** (light + dark, A/B/C comparison,
full status lineup). Build contract for the Svelte change.

## Problem
Repos that only run CI on push to `main` have open PRs with zero runs. `poll.ts` falls back to `'unknown'`, so the
row shows the purple **?** and reads as broken. Main already handles its own case with muted "No pipelines yet".

## Decisions (final)
1. **Status slot — hollow ring.** 16px circle (same slot, same size), transparent fill, `inset 0 0 0 1.5px var(--neutral)`,
   no glyph. Only hollow shape in the slot → distinct from canceled (solid `--neutral` + slash) and skipped (inverted ink + chevrons).
   Empty slot rejected (reads as a missing icon; nothing to hover). Dash rejected (one rotation from the canceled slash; first non-circle in the column).
2. **Copy — "no pipelines".** Agrees with main's "No pipelines yet" and the product noun; works for GitHub and GitLab.
   "Checks" is GitHub-only, "CI" is jargon. No "yet" on PRs — in a main-only repo nothing is coming. Lowercase like the other StatusIcon labels.
3. **Row text — none.** Icons carry meaning; the word lives in tooltip + `aria-label`. Only visible difference: no run time in `meta-end` (keep the author).
4. **Unknown — keep purple `?`, update README.** Unknown = "provider sent a status we don't recognise": a real anomaly, so it must not be grey. Purple is the one hue no other state uses.

## Model
Absence, not a status. Do **not** add a `PipelineStatus` value.
```ts
// providers/types.ts
export interface Change { …; status: PipelineStatus | null }   // null = no run matched headRef
// poll.ts
status: pipeline?.status ?? previous?.status ?? null           // was 'unknown'
```
`'unknown'` is now reserved for `mapGithubStatus` / `mapGitlabStatus` fall-throughs.

## StatusIcon
```svelte
<!-- StatusIcon.svelte: status: PipelineStatus | null -->
<span class="status" class:none={status === null} role="img" aria-label={label} use:tooltip={label} …>
  {#if status !== null}<svg …/>{/if}
</span>
```
```css
.status.none { background: transparent; box-shadow: inset 0 0 0 1.5px var(--neutral); }
```
`status-icon.ts`: `statusVisual(null)` → `{ colour: 'transparent', symbol: 'none', label: 'no pipelines' }`, or branch in the component — pick one.
Contrast of the `--neutral` stroke: ≈3.9:1 on light `--bg`, ≈3.3:1 on light `--hover`, ≈7:1 dark — all ≥ 3:1 (non-text).
`--border-2` and `--text-3` both fail 3:1 in light; do not substitute.

## ChangeRow
- `data-status="none"` (no left strip, no tint). Row still links to the PR/MR `webUrl`.
- `aria-label`: `#149 Bump deps on chore/deps, no pipelines`.
- `meta-end`: skip `RelativeTime`/`ElapsedTime` (no `updatedAt`); render `Author` as usual.
- Drafts keep the 0.55 opacity.

## Filtering, counting, notifying
- **No new chip.** Visible only while every status chip is on (same predicate as `noPipelinesVisible`: `BRANCH_STATE_ORDER.every(allowed.has)`). Any narrowed filter hides these rows.
- Counts toward the repo `pr-count` chip (it is an open PR). Never toward `failingCount`, the fail badge, or the action badge.
- `notify`: `null → X` is a first status, not a transition; `X → null` (run deleted) is silent.

## Surfaces
Side panel, popup, showcase — one component, so one change. Showcase: add one `status: null` row (non-draft) and keep a `'unknown'` row so the purple `?` is still demonstrated.

## README
Replace "neutral grey dot" for unknown with: purple circle, `?` glyph, "provider returned a status Pipes doesn't recognise". Add the ring: "no pipelines — open PR/MR with no run on its head commit".

## Motion / themes
Static; nothing to gate on `prefers-reduced-motion`. Tokens handle light/dark.
