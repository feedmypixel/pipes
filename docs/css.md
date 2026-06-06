# CSS architecture

How CSS is structured in Pipes: tokens-first, scoped components, a shared scale. Companion to
[`src/lib/styles/README.md`](../src/lib/styles/README.md) (the file-by-file reference) and
[`docs/forms.md`](forms.md). The rule that drives everything: **a component renders correctly
with zero global classes; only tokens are shared.**

## Layers

There is no single global stylesheet — an extension has a separate HTML entry per surface, so
"global" CSS is imported into each entry and Vite dedupes per build.

1. **`tokens.css`** — the single source of truth for _values_: colours (per theme), and the
   rem **scales** (space, font-size, line-height, weight, radii). Nothing else may hard-code a
   scale value.
2. **`base.css`** — Josh Comeau's reset (trimmed for desktop Chrome) plus element defaults and
   body type from tokens.
3. **`a11y.css`** — accessibility helpers only (`.visually-hidden`).
4. **Component scoped `<style>`** — everything else. Each component owns its chrome, built from
   tokens. No global utility classes inside components; no global form/toast stylesheet.

## Components vs global CSS — the sweet spot

status-ui/portal run a full ITCSS stack (`objects.css`, `utilities.css`, `patterns.css`).
Pipes deliberately does **not** — and that is the right call for an extension this size:

- **Scoped components + tokens cover it.** Every visual is a Svelte component with scoped
  styles; shared values flow through tokens. There's no repetition that a utility/object layer
  would dry up, so adding one would be speculative (YAGNI).
- **Buttons, banners, toasts, fields are components, not utility classes.** That's the
  componentisation line: anything with markup + behaviour is a component (`<Button>`,
  `<Banner>`, `<Field>`); tokens carry the shared _values_. We don't apply global classes inside
  components.

**When to introduce a global layer** (revisit, don't pre-build):

- A genuinely classless, repeated layout primitive used across many surfaces (e.g. a `.stack`
  / `.cluster` object) — then a small `objects.css` earns its place.
- A utility repeated verbatim in 3+ components that _can't_ be a token (rare).

Until then: component or token. Nothing global but `tokens` / `base` / `a11y`.

## Icons

The toolbar/extension icons (`icons/*.png`) are **PNG because Chrome MV3 requires raster** for
`action.default_icon` + `icons` — SVG isn't accepted there. They're generated from the SVG logo
via `pnpm icons` (sharp). So the source is vector; only the shipped extension icon must be PNG.

## Units — rem, not px

**Scale values use rem** (root = 16px), so the UI scales with the user's browser font-size
(accessibility). px is reserved for genuine device-pixel work: `1px` borders, shadow offsets,
fixed icon boxes. Never hard-code a px font-size or spacing in a component — use a token.

`0.0625rem = 1px`. The scale comments in `tokens.css` give the px equivalent of each step.

## Spacing scale

Pipes is **dense UI** (popup/options chrome runs tighter than a typical app), so the scale has
a 2px baseline at the small end, widening to 4px:

| token         | rem   | px  |
| ------------- | ----- | --- |
| `--space-3xs` | 0.125 | 2   |
| `--space-2xs` | 0.25  | 4   |
| `--space-xs`  | 0.375 | 6   |
| `--space-sm`  | 0.5   | 8   |
| `--space-md`  | 0.625 | 10  |
| `--space-lg`  | 0.75  | 12  |
| `--space-xl`  | 0.875 | 14  |
| `--space-2xl` | 1     | 16  |
| `--space-3xl` | 1.25  | 20  |
| `--space-4xl` | 1.5   | 24  |
| `--space-5xl` | 2     | 32  |

Use these for **margin, padding, and `gap`**. Off-scale values (9, 11, 13px…) are the magic
numbers this replaces — snap to the nearest step. Snapping _to_ the scale is what creates
vertical rhythm: spacing repeats instead of drifting.

## Type scale

| token              | rem    | px  | role                   |
| ------------------ | ------ | --- | ---------------------- |
| `--font-size-2xs`  | 0.625  | 10  | micro labels, eyebrows |
| `--font-size-xs`   | 0.6875 | 11  | mono, captions         |
| `--font-size-sm`   | 0.75   | 12  | secondary text         |
| `--font-size-base` | 0.8125 | 13  | **body / default**     |
| `--font-size-md`   | 0.875  | 14  | emphasised body        |
| `--font-size-lg`   | 0.9375 | 15  | small headings         |
| `--font-size-xl`   | 1      | 16  | headings               |
| `--font-size-2xl`  | 1.3125 | 21  | page title             |

Half-pixel sizes (11.5, 12.5, 13.5) were fussy magic numbers — snap to the nearest step.

## Line height

Set with the reader in mind: tighter for headings, looser for running copy.

| token               | value | use                                             |
| ------------------- | ----- | ----------------------------------------------- |
| `--leading-none`    | 1     | single-line chrome (buttons, chips, icon boxes) |
| `--leading-tight`   | 1.2   | headings                                        |
| `--leading-snug`    | 1.35  | dense rows                                      |
| `--leading-normal`  | 1.45  | **body default**                                |
| `--leading-relaxed` | 1.55  | notes, multi-line help                          |

## Weight

`--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 650 · `--weight-heavy` 700.

## Vertical rhythm & whitespace

- **Space comes from one side.** Prefer a parent `gap` or a consistent `margin-bottom`; don't
  fight margin-collapse with top+bottom on the same elements. Stacked form fields use a single
  `margin-bottom` (`--space-2xl`) so the gaps are uniform.
- **Group with proximity.** Related items get a small step (`--space-sm`/`--space-md`);
  section breaks get a large one (`--space-4xl`/`--space-5xl`). The size _difference_ is what
  signals grouping.
- **Whitespace is deliberate.** Every gap is a token chosen for rhythm, never an eyeballed px.

## Readability

- Body copy at `--font-size-base` / `--leading-normal`. Multi-line help at `--leading-relaxed`.
- Keep measure (line length) sane — cap text containers with a `max-width` rather than letting
  copy run the full surface width.
- Sentence case, no all-caps (see styling README). Hyphens, not em-dashes.

## Conventions

- **No magic numbers** in component styles — reference a `--space-*` / `--font-size-*` /
  `--leading-*` / `--weight-*` token. The exception is true device-pixel values (`1px` border).
- **No hex outside `tokens.css`** (the `white` keyword for status glyphs is allowed).
- **Tokens are the only shared surface** between components — never a shared class.
- Scoped `<style>` per component; a component must render with zero global classes.

> **Migration status.** Done — scales + reset in place, and all component + surface styles use
> the tokens. The only remaining raw px are device-pixel values (borders, focus/shadow geometry),
> fixed control boxes (icon buttons, toggle, stepper), and layout `max-width`s.
