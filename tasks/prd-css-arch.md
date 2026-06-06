# PRD: CSS architecture — scales, reset, rhythm

## Introduction / Overview

Pipes' component styles are full of magic numbers (raw `9px`/`11px`/`12.5px`/`13px` spacing and
font sizes, scattered `1.4`/`650` literals). There's no spacing or type scale, no shared
vertical rhythm, and `base.css` was a thin reset. This establishes a **rem scale system**
(matching portal's approach; see the status-ui alignment handoff) + Josh Comeau's reset, and
migrates component styles onto it.

Authoritative reference: `docs/css.md`.

## Goals

1. One source of truth for spacing / type / line-height / weight — **rem scales in
   `tokens.css`**, no magic numbers in components.
2. **Josh Comeau reset** in `base.css` (text-wrap, sane media defaults, reduced-motion).
3. Real **vertical rhythm**: spacing snaps to the scale; uniform field/section gaps.
4. A CSS architecture **doc** (`docs/css.md`).

## Non-Goals

- A utilities/objects/patterns layer (status-ui has it; overkill for an extension — per-surface
  layout stays in scoped styles).
- Changing the visual design. Values snap to the nearest scale step; minor (≤1-2px) shifts are
  expected and are the rhythm improvement, not a redesign.
- rem-ifying true device-pixel values (`1px` borders, shadow offsets).

## Functional Requirements

1. **Scales in `tokens.css`** (rem, root 16px): `--space-*` (2px baseline → 32), `--font-size-*`
   (10 → 21, dense), `--leading-*`, `--weight-*`. ✅
2. **Josh reset** in `base.css`, trimmed for desktop Chrome (no iOS-16px floor); body type from
   tokens. ✅
3. **`docs/css.md`** — layers, units (rem rationale), the scales, vertical rhythm, readability,
   conventions. ✅
4. **Migrate component styles** off magic numbers onto tokens, per area: ✅
   - Form + notification components (`forms/`, Button, Banner, Toast, ToastHost, PermissionNote,
     MessageIcon). ✅
   - Shared primitives (`Row`, `StatusIcon`, `RefChip`, `RelativeTime`). ✅
   - Surfaces (`popup`, `options`, `sidepanel`, `showcase`). ✅
     (Also fixed a forms-PR regression: the "Load repositories" button was a raw `.btn` left
     unstyled when `forms.css` was deleted — now a `<Button>`.)
5. **Visual check** — popup + options + showcase screenshotted light + dark; design unchanged
   bar intended rhythm snaps. ✅

## Technical Considerations

- `0.0625rem = 1px`. Most pipes values map exactly (12→`--space-lg`, 16→`--space-2xl`); the
  off-scale ones (9, 11, 13, 12.5) snap to the nearest step — that snapping is the point.
- Keep `1px` borders, shadow offsets, fixed icon boxes, and layout `max-width`s as px.
- Tests assert structure/classes, not px — they stay green across the migration.

## Success Metrics

- `grep -rE "[0-9]+px" src --include=*.svelte` returns only device-pixel values (borders,
  shadows, fixed boxes) and layout max-widths — no scale values.
- `pnpm check` / `lint` / `test` green; surfaces visually unchanged bar intended rhythm snaps.

## Open Questions

1. Layout `max-width`s (`720`, `380`, `520`px) — leave as px (layout, not scale) or add a small
   set of width tokens? (Lean: leave as px, they're one-offs.)

## Cross-repo

status-ui is px-based; the rem alignment handoff lives at the status-ui repo root
(`CSS-REM-ALIGNMENT-HANDOFF.md`). portal is already rem.
