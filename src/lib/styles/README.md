# Styling

How CSS works in Pipes. Tokens-first, scoped components, modern CSS only (no SCSS, no BEM).

## The files here

| File         | Role                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tokens.css` | **The single source of truth for values.** All design tokens as CSS custom properties: cool-slate neutrals, the brand, the OKLCH status palette, the dark app-bar, radii, type, shadows. Light is `:root`; dark applies via `@media (prefers-color-scheme: dark)` and an explicit `[data-theme]` override. Values are lifted verbatim from `design/v1/assets/pipes.css`. |
| `base.css`   | Global reset + element defaults: `box-sizing`, body font/colour from tokens, `:focus-visible` ring, `prefers-reduced-motion` guard. No component styling.                                                                                                                                                                                                                |
| `a11y.css`   | Accessibility helpers only (`.visually-hidden`). Not a utility-class system.                                                                                                                                                                                                                                                                                             |
| `forms.css`  | The form + banner + toast system stylesheet (field states, inline errors, FormSummary, buttons, toasts). The one place that chrome is defined; components reference it by class. Driven by tokens. See [`docs/forms.md`](../../../docs/forms.md).                                                                                                                        |

Each surface entry (`src/{popup,sidepanel,options,showcase}/main.ts`) imports tokens + base +
a11y; the forms surfaces (options, showcase) also import `forms.css`.
There is no single global document — an extension has separate HTML entries per surface —
so "global" CSS is imported into each entry and Vite dedupes per build.

## Rules

- **Tokens are the only shared surface.** Components share values via `var(--token)`,
  never via shared classes. A component must render correctly with zero global classes.
- **No hex outside `tokens.css`.** Components reference `var(--*)` (or the `white` keyword
  for status glyphs). Convention today; stylelint will enforce it (see
  `tasks/hardening-backlog.md`).
- **Scoped `<style>` per component.** No global utility classes inside components.
- **Brand `#3194fc` is identity/links/focus only — never a status colour.** Status hues
  are the OKLCH set.
- **No all-caps; sentence case.** Respect `prefers-color-scheme` and `prefers-reduced-motion`.

## Theming

Automatic from the OS. A dev-only console override (`src/lib/dev-theme.ts`, gated by
`import.meta.env.DEV`, excluded from production) forces a theme:
`pipesTheme('dark' | 'light' | 'auto')` sets/clears `data-theme` on the root.

## What is deliberately not here (yet)

- **`utilities.css` / `objects.css` / `patterns.css`** (as in status-ui) — overkill for a
  small extension; per-surface layout lives in the surface's own scoped styles.
- **stylelint** token enforcement — planned in the hardening pass.
- The component showcase (`src/showcase/`) renders every primitive in both themes for
  visual checking: `http://localhost:5173/src/showcase/` with `pnpm dev`.

Source of truth for token _values_: `design/v1/assets/pipes.css` (and `design/v1/README.md`).
