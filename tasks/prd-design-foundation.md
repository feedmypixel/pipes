# PRD: Design Foundation

## Contents

- [Introduction / Overview](#introduction--overview)
- [Goals](#goals)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Non-Goals (Out of Scope)](#non-goals-out-of-scope)
- [Design Considerations](#design-considerations)
- [Technical Considerations](#technical-considerations)
- [Success Metrics](#success-metrics)
- [Open Questions](#open-questions)

## Introduction / Overview

Pipes has a complete, type-checked background engine (providers, polling, storage,
notifications) but **no UI yet**. The v1 design (`design/v1/`) specifies four surfaces
(popup, side panel, options, notifications) that all share the same visual language:
the same colour/spacing/type tokens, the same status iconography, and the same repo
**row**.

This PRD covers the **foundation** those surfaces are built on, so each surface PRD
can _assemble_ primitives instead of reinventing them:

1. A global token + base stylesheet lifted from the design bundle.
2. Light / dark theming (auto, plus a dev-only switcher for previewing).
3. The Lucide icon setup.
4. The shared primitives every surface reuses: **StatusIcon**, **Row**, **RefChip**,
   **RelativeTime**.
5. A dev-only **component showcase** page to eyeball every primitive in every state and
   both themes while building.

Goal: a stable, design-faithful base layer so the popup, side panel, and options surfaces
are pure composition.

## Goals

1. Reproduce the design's tokens exactly (one source of truth, consumed via `var(--*)`).
2. Light and dark both correct, driven by `prefers-color-scheme`, with no user-facing
   toggle but a dev-only override for previewing.
3. Ship the four shared primitives, each self-contained (scoped styles, tokens only),
   pixel-faithful to `design/v1/`.
4. Make every primitive visually verifiable in isolation across states and themes.
5. Add zero runtime weight beyond Lucide's tree-shaken icons and (dev-only) the showcase.

## User Stories

- **As a developer building a surface**, I import `StatusIcon`, `Row`, and `RefChip` and
  they already match the design, so I focus on layout, not styling.
- **As a developer**, I open the showcase page and flip light/dark to confirm a primitive
  looks right in both themes before wiring it into a surface.
- **As a user**, the extension matches my OS light/dark preference automatically.
- **As a user relying on a screen reader**, each status circle announces its meaning
  (the status word lives in `title`, not just colour).

## Functional Requirements

### Tokens & base styles

1. Create `src/lib/styles/tokens.css` with all design tokens, values lifted **verbatim**
   from `design/v1/assets/pipes.css`: brand (Pixel Blue `#3194FC` light / `#5AA8FF` dark,
   brand-soft, link), cool-slate neutrals (bg, canvas, surface, surface-2, hover, border,
   border-2, text, text-2, text-3), the OKLCH status palette (success, failed, running,
   pending, canceled/skipped/unknown) each with base + bg-tint + line, radii (4px; round
   for pills/circles), spacing (4px base), and type (system sans + mono stacks, sizes,
   weights).
2. Light and dark token sets are defined under `[data-theme='light']` and
   `[data-theme='dark']` blocks (matching `pipes.css`), so a single `data-theme` attribute
   on the root switches the whole palette.
3. Create `src/lib/styles/base.css`: a minimal reset, `box-sizing: border-box`, the body
   font stack and base text/`bg` colours from tokens, `:focus-visible` ring using the brand
   focus token, and a `prefers-reduced-motion` guard. No component styling here.
4. No hex literals anywhere outside `tokens.css`. Components reference `var(--*)` only.

### Theming

5. The effective theme follows `prefers-color-scheme` by default (no user-facing toggle).
   Implement by setting `data-theme` on the root from a `matchMedia('(prefers-color-scheme: dark)')`
   read, updated on change.
6. Provide a **dev-only** theme switcher (light / dark / system) that overrides `data-theme`
   for previewing. It must be gated by the dev build (`import.meta.env.DEV`) and **must not**
   appear in or affect the production bundle.

### Icons

7. Add `@lucide/svelte` and use **named imports** for the icons the design lists
   (`refresh-cw`, `panel-right`, `settings`, `git-branch`, `external-link`, `chevron-down`,
   `search`, `check`, `plus`, `trash-2`, `lock`, `triangle-alert`, `plug`, `zap`). Do not
   inline Lucide SVGs.

### Shared primitives (`src/lib/components/`)

8. **`StatusIcon.svelte`**, a solid colour circle with a white symbol on a transparent
   background, one unified set for both providers. Props: `status: PipelineStatus`,
   `size` (default 20, dense 18, larger for other surfaces). Symbols per the design:
   success = check, failed = ✗, running = spinning arc, pending = pause, canceled = slash,
   skipped = double-chevron, unknown = dot. The status **word is never shown inline**; it is
   the element's `title` (hover) and an accessible label. Running spins, but honours
   `prefers-reduced-motion`.
9. **`RefChip.svelte`**, the branch/ref pill: `git-branch` icon + ref name in mono. Props:
   `ref: string`.
10. **`RelativeTime.svelte`**, renders a relative timestamp ("just now", "5h ago", "1d ago")
    in mono from an ISO string. Self-updates on a sensible interval and tears the timer down
    on destroy. Props: `iso: string`.
11. **`Row.svelte`**, the shared repo row reused by popup **and** side panel. Grid
    `auto 1fr auto`: `[StatusIcon] [name + meta] [external-link on hover]`. Name = project
    in mono-ish semibold; meta line = `RefChip` · `RelativeTime`. Failed/running rows get a
    2px coloured left edge; a failed-on-default-branch row gets a red tint + 3px edge. The
    whole row is a link opening `Pipeline.webUrl` in a new tab
    (`target="_blank" rel="noopener noreferrer"`). Props: a `Pipeline` (+ display name);
    a `dense` flag for side-panel padding (`7px 14px` vs `10px 14px`).
12. Every primitive is self-contained: scoped `<style>`, depends only on tokens, renders
    correctly with zero global utility classes.

### Dev showcase

13. Add a **dev-only** showcase surface that renders every primitive across all relevant
    states (all 7 statuses for `StatusIcon`; healthy/failed/running/default-branch-failed
    `Row` variants; `RefChip`; `RelativeTime`) with the dev theme switcher so both themes are
    previewable. Must be excluded from the production build.

### Logo / icons (already in place, verify)

14. The extension icon set is the static green tick, generated from
    `design/v1/assets/logo-pipes.svg` by `scripts/generate-icons.mjs` (`pnpm icons`).
    Confirm the four PNG sizes exist and the manifest references them. **The toolbar icon is
    static and never changes** (the red badge count is the failure signal).

### Quality gates

15. `pnpm check`, `pnpm lint`, and `pnpm test` pass. New pure logic (e.g. relative-time
    formatting, status→symbol mapping) is unit-tested beside its source.

## Non-Goals (Out of Scope)

- Popup, side panel, options, and notification surfaces (their own PRDs), this is only the
  shared layer they consume.
- Owner grouping, the alarm strip, the "pipe rail", health summary, forms, the incident
  banner, surface-specific, deferred.
- Any dynamic toolbar icon / `chrome.action.setIcon` behaviour. **The logo is static.**
- A user-facing theme toggle (auto only; dev-only switcher excepted).
- GitHub/GitLab brand marks (the design drops provider marks; grouping is by owner).

## Design Considerations

- Authoritative spec: `design/v1/README.md`. Exact values: `design/v1/assets/pipes.css`.
  Component shapes for reference: `design/v1/assets/components.js`. Sample data:
  `design/v1/assets/data.js`. Screenshot: `design/v1/screenshots/01-popup.png`.
- Lift the **visual treatment**, not the bundle's markup or class names; translate to
  Svelte 5 + scoped CSS over the global tokens.
- Type: system stack (ships nothing). Mono for refs, SHAs, timestamps, counts. No all-caps;
  sentence case.

## Technical Considerations

- Each surface HTML entry imports `base.css` + `tokens.css` once; primitives assume the
  tokens are present.
- `StatusIcon`/`Row` consume the existing normalized model (`PipelineStatus`, `Pipeline`
  from `src/providers/types.ts`), no new data shapes.
- Dev-only code (theme switcher, showcase) is gated on `import.meta.env.DEV` and tree-shaken
  out of production, never via `NODE_ENV` runtime branches in shipped paths.
- Svelte 5 runes only; tear down `matchMedia` listeners and `RelativeTime` timers in
  `$effect` cleanup.

## Success Metrics

- All four primitives render pixel-faithfully to `design/v1/` in both themes (verified on the
  showcase).
- A surface PRD can build a working list using only `Row` + `StatusIcon` + `RefChip` with no
  extra styling.
- `pnpm check && pnpm lint && pnpm test` green; production build contains no dev-only showcase
  or switcher.

## Open Questions

1. Exact self-update interval for `RelativeTime` (30s vs 60s), pick the lower-churn option
   that still feels live; confirm during build.
2. Whether the dev showcase is a standalone HTML entry (crxjs) or only run via `pnpm dev`
   outside the extension, decide for least production-bundle risk during task breakdown.
