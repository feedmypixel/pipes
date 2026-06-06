# Styling

How CSS works in Pipes. Tokens-first, scoped components, modern CSS only (no SCSS, no BEM).
Architecture, scales, and vertical rhythm: see [`docs/css.md`](../../../docs/css.md).

## The files here

| File         | Role                                                           |
| ------------ | -------------------------------------------------------------- |
| `tokens.css` | Single source of truth: colours (per theme) + rem scales.      |
| `base.css`   | Reset (Josh Comeau) + element defaults; body type from tokens. |
| `a11y.css`   | Accessibility helpers (`.visually-hidden`).                    |

Each surface entry (`src/{popup,sidepanel,options,showcase}/main.ts`) imports all three. Form,
banner, and toast chrome lives in each component's scoped `<style>` (see
[`docs/forms.md`](../../../docs/forms.md)), not a global stylesheet — only tokens are shared.
There is no single global document — an extension has separate HTML entries per surface — so
"global" CSS is imported into each entry and Vite dedupes per build.

## Rules

- **Tokens are the only shared surface.** Components share values via `var(--token)`, never via
  shared classes. A component must render correctly with zero global classes.
- **No magic numbers.** Spacing/type/line-height/weight come from the scale tokens (see
  `docs/css.md`); only true device-pixel values (`1px` borders) are raw px.
- **No hex outside `tokens.css`** (the `white` keyword for status glyphs is allowed).
- **Scoped `<style>` per component.** No global utility classes inside components.
- **Brand `#3194fc` is identity/links/focus only — never a status colour.** Status hues are the
  OKLCH set.
- **No all-caps; sentence case.** Respect `prefers-color-scheme` and `prefers-reduced-motion`.

## Theming

Automatic from the OS. A dev-only console override (`src/lib/dev-theme.ts`, gated by
`import.meta.env.DEV`, excluded from production) forces a theme:
`pipesTheme('dark' | 'light' | 'auto')` sets/clears `data-theme` on the root.

## What is deliberately not here (yet)

- **`utilities.css` / `objects.css` / `patterns.css`** (as in status-ui) — overkill for a small
  extension; per-surface layout lives in the surface's own scoped styles.
- **stylelint** token enforcement — planned in the hardening pass.
- The component showcase (`src/showcase/`) renders every primitive in both themes:
  `http://localhost:5173/src/showcase/` with `pnpm dev`.

Source of truth for token _values_: `design/v1/assets/pipes.css` (and `design/v1/README.md`).
