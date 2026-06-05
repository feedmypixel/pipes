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

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout `feature/design-foundation`

- [ ] 1.0 Global stylesheets (lifted from `design/v1/assets/pipes.css`)
  - [ ] 1.1 Read `design/v1/assets/pipes.css`; pull exact token values (brand, neutrals, OKLCH status set, radii, spacing, type)
  - [ ] 1.2 `tokens.css`: `:root` (light) + `@media (prefers-color-scheme: dark)` + `[data-theme='dark']`/`[data-theme='light']`, same token names
  - [ ] 1.3 `base.css`: reset, `box-sizing: border-box`, body font/text/bg from tokens, `:focus-visible` ring, `prefers-reduced-motion` guard
  - [ ] 1.4 `a11y.css`: `.visually-hidden` only
  - [ ] 1.5 Import the three stylesheets in each surface entry (`popup`/`sidepanel`/`options` `main.ts`)
  - [ ] 1.6 Confirm stylelint passes (hex only in `tokens.css`)

- [ ] 2.0 Theme handling
  - [ ] 2.1 `dev-theme.ts`: `import.meta.env.DEV`-gated `globalThis.pipesTheme('dark'|'light'|'auto')` sets/clears root `data-theme`
  - [ ] 2.2 Import it (dev-only) from the surface entries
  - [ ] 2.3 Verify console override flips theme in dev; confirm it is tree-shaken from the production build

- [ ] 3.0 Lucide + shared primitives
  - [ ] 3.1 `pnpm add @lucide/svelte`
  - [ ] 3.2 `status-icon.ts` pure map (`status -> { symbol, colourVar }`) + `status-icon.test.ts`
  - [ ] 3.3 `StatusIcon.svelte`: coloured circle + white symbol, sizes, `title` + aria label, spin on running with reduced-motion guard
  - [ ] 3.4 `RefChip.svelte`: `git-branch` + ref in mono
  - [ ] 3.5 `relative-time.ts` formatter + `relative-time.test.ts`
  - [ ] 3.6 `RelativeTime.svelte`: renders + self-updates from `iso`, tears the timer down in `$effect` cleanup
  - [ ] 3.7 `Row.svelte`: `auto 1fr auto` grid (StatusIcon / name + meta / external-link on hover), left-edge + failed-on-main tint, whole-row link `_blank rel="noopener noreferrer"`, `dense` prop
  - [ ] 3.8 Scoped styles for each, tokens only, no hex

- [ ] 4.0 Verify logo/icons + quality gates
  - [ ] 4.1 Add `<script lang="ts">` to `src/{popup,sidepanel,options}/App.svelte` (fixes the scriptless-component `svelte-check` resolution)
  - [ ] 4.2 Temporarily render the primitives in the popup stub (all `StatusIcon` states + a few `Row` variants) so they're visible in the running extension; mark as scaffolding the popup PRD replaces
  - [ ] 4.3 Verify `pnpm icons` output (green-tick PNGs) exists and the manifest references them
  - [ ] 4.4 `pnpm check`, `pnpm lint`, `pnpm test` green
