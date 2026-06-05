# Tasks: Design Foundation

From `tasks/prd-design-foundation.md`. The shared token + primitive layer every surface
sits on. Design source of truth: `design/v1/` (`README.md` spec, `assets/pipes.css` exact values).

## Relevant Files

- `src/lib/styles/tokens.css` - all design tokens (`:root` light, dark via media + `[data-theme]`).
- `src/lib/styles/base.css` - reset, box-sizing, body font/colours, focus ring, reduced-motion.
- `src/lib/styles/a11y.css` - `.visually-hidden` and accessibility helpers only.
- `src/lib/dev-theme.ts` - dev-only console theme override (`globalThis.pipesTheme`), gated by `import.meta.env.DEV`.
- `src/lib/relative-time.ts` - pure ISO -> relative-time formatter.
- `src/lib/relative-time.test.ts` - unit tests for the formatter.
- `src/lib/components/StatusIcon.svelte` - status circle + symbol; consumes `PipelineStatus`.
- `src/lib/components/status-icon.ts` - pure `status -> { symbol, colourVar }` map.
- `src/lib/components/status-icon.test.ts` - unit tests for the map.
- `src/lib/components/RefChip.svelte` - branch/ref pill (`git-branch` + mono ref).
- `src/lib/components/RelativeTime.svelte` - live relative timestamp.
- `src/lib/components/Row.svelte` - shared repo row (popup + side panel).
- `src/{popup,sidepanel,options}/main.ts` - import global styles + (dev) the theme override.
- `src/{popup,sidepanel,options}/App.svelte` - add `<script lang="ts">`; popup temporarily previews the primitives.
- `scripts/generate-icons.mjs` - verify it rasterizes `design/v1/assets/logo-pipes.svg`.
- `package.json` - add `@lucide/svelte`.

### Notes

- Tests sit beside source; vitest globals (no importing `test`/`expect`); use `test`, not `it`.
- I'll work in parent-task batches, run `check`/`lint`/`test` at each boundary, and report before moving on.
- Components depend on tokens only (no hex outside `tokens.css`, no global utility classes).

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout `feature/design-foundation`

- [x] 1.0 Global stylesheets (lifted from `design/v1/assets/pipes.css`)
  - [x] 1.1 Read `design/v1/assets/pipes.css`; pull exact token values (brand, neutrals, OKLCH status set, radii, spacing, type)
  - [x] 1.2 `tokens.css`: `:root` (light) + `@media (prefers-color-scheme: dark)` + `[data-theme='dark']`, same token names (dropped the `--p-` prefix)
  - [x] 1.3 `base.css`: reset, `box-sizing: border-box`, body font/text/bg from tokens, `:focus-visible` ring, `prefers-reduced-motion` guard
  - [x] 1.4 `a11y.css`: `.visually-hidden` only
  - [x] 1.5 Import the three stylesheets in each surface entry (`popup`/`sidepanel`/`options` `main.ts`)
  - [x] 1.6 N/A: this repo has no stylelint; no-hex-outside-tokens is convention + prettier-enforced

- [x] 2.0 Theme handling
  - [x] 2.1 `dev-theme.ts`: `import.meta.env.DEV`-gated `globalThis.pipesTheme('dark'|'light'|'auto')` sets/clears root `data-theme`
  - [x] 2.2 Import it (dev-only) from the surface entries
  - [x] 2.3 Verify console override flips theme in dev; confirm it is tree-shaken from the production build

- [x] 3.0 Lucide + shared primitives
  - [x] 3.1 `pnpm add @lucide/svelte`
  - [x] 3.2 `status-icon.ts` pure map (`status -> { symbol, colourVar }`) + `status-icon.test.ts`
  - [x] 3.3 `StatusIcon.svelte`: coloured circle + white symbol, sizes, `title` + aria label, spin on running with reduced-motion guard
  - [x] 3.4 `RefChip.svelte`: `git-branch` + ref in mono
  - [x] 3.5 `relative-time.ts` formatter + `relative-time.test.ts`
  - [x] 3.6 `RelativeTime.svelte`: renders + self-updates from `iso`, tears the timer down in `$effect` cleanup
  - [x] 3.7 `Row.svelte`: `auto 1fr auto` grid (StatusIcon / name + meta / external-link on hover), left-edge + failed-on-main tint, whole-row link `_blank rel="noopener noreferrer"`, `dense` prop
  - [x] 3.8 Scoped styles for each, tokens only, no hex

- [x] 4.0 Dev-only component showcase
  - [x] 4.1 New dev-only surface (`src/showcase/`, its own HTML entry, served by vite dev, excluded from the production build and the manifest)
  - [x] 4.2 Render every primitive across states: all 7 `StatusIcon` statuses, the `Row` variants (healthy / failed / running / failed-on-default / dense), `RefChip`, `RelativeTime`, plus token swatches
  - [x] 4.3 In-page light/dark/auto toggle (and the `pipesTheme()` console override); verified rendering in both themes via Playwright screenshots

- [x] 5.0 Verify logo/icons + quality gates
  - [x] 5.1 Add `<script lang="ts">` to `src/{popup,sidepanel,options}/App.svelte` (fixes the scriptless-component `svelte-check` resolution); done early to keep the tree green
  - [x] 5.2 Verify `pnpm icons` output (green-tick PNGs) exists and the manifest references them
  - [x] 5.3 Confirm the showcase entry is absent from the production build (0 showcase files in `dist/`)
  - [x] 5.4 `pnpm check`, `pnpm lint`, `pnpm test` green
