# CLAUDE.md

Pipes-specific notes only. The global `~/.claude/CLAUDE.md` holds the universal rules
(simplicity, go-slow, YAGNI, surgical changes, consistency, comments, brevity, naming,
implicit TypeScript, code style, testing prefs, no-disabled-buttons UX, pre-commit gates,
git hygiene). Don't duplicate it here.

## What Pipes is

Chrome (Manifest V3) extension. Watches GitHub Actions + GitLab CI/CD status across chosen
repos; loud the moment the default branch breaks. **Fully client-side, no backend**: it calls
provider APIs directly using the user's read-only token and keeps all state in `chrome.storage`.

## Stack

- Svelte 5 (runes) + Vite 6 + `@crxjs/vite-plugin` (typed MV3 manifest + HMR) + TypeScript
- `@lucide/svelte` icons · `sharp` rasterizes SVGs → icon PNGs
- Vitest 4 · ESLint flat config + Prettier + eslint-plugin-svelte/-security
- `pnpm` only (pinned in `.npmrc`, Node in `.nvmrc` — `nvm use` first)

## Commands

```bash
pnpm dev             # crxjs + Vite, builds dist/ with HMR
pnpm build           # production build → dist/
pnpm check           # svelte-check / type-check
pnpm lint            # prettier --check . && eslint .
pnpm format          # prettier --write .
pnpm test            # vitest run (unit + browser projects)
pnpm security-audit  # pnpm audit --audit-level=moderate
pnpm icons           # rasterize assets/*.svg → icons/*.png
```

## Layout

```
src/
├── manifest.config.ts     # typed MV3 manifest (crxjs)
├── providers/             # normalize GitHub + GitLab into one model
│   ├── types.ts           #   Account, Repo, Pipeline, Change, Provider interface
│   ├── github.ts          #   GitHub Actions runs + open pulls
│   ├── gitlab.ts          #   GitLab pipelines + open merge requests
│   └── index.ts           #   provider registry + host helpers
├── lib/
│   ├── storage.ts         # typed chrome.storage wrappers + change subscribe
│   ├── group.ts           # owner/repo grouping + status view model
│   ├── notify.ts          # notifications + toolbar badge
│   ├── live-port.ts       # keep-alive port that drives the live poll loop
│   ├── components/        # shared Svelte UI (StatusIcon, Row, ChangeRow, RepoCard, …)
│   └── styles/            # tokens.css (+ base) lifted from the design bundle
├── background/            # service-worker.ts (lifecycle) + poll.ts (fetch→join→diff→notify)
└── popup/ · sidepanel/ · options/   # the three HTML surface entries
design/ · tasks/ · scripts/ · icons/
```

## Extension specifics (MV3)

- The service worker is **ephemeral** (killed after ~30s idle). Keep **no state in module
  globals** that must survive a restart: persist via `chrome.storage`, schedule via
  `chrome.alarms`, register all listeners synchronously at the top level.
- Tokens (PATs) are **read-only**, in `chrome.storage.local`, never synced, never logged.
  GitHub fine-grained (Actions + Pull requests: read); GitLab `read_api`.
- `host_permissions` covers SaaS hosts; self-hosted / Enterprise origins are requested at
  runtime via `optional_host_permissions` + `chrome.permissions.request()` on a user gesture.
- Adding a provider = a new adapter implementing `Provider`, registered in `providers/index.ts`.
- Per repo Pipes shows the **default-branch run + open PRs/MRs** (PR status joined from the runs
  list by head ref). UIs subscribe to the `snapshots` key; the worker polls, diffs, notifies on
  transitions, sets the badge.
- **The toolbar icon is the static green tick and never changes** — the failure signal is the red
  badge count.

## Config & environment

No runtime env vars, no `.env`, nothing injected at build time.

- User config is **runtime data**, not env: accounts, tokens, watched repos, settings live in
  `chrome.storage.local`, read/written only through `src/lib/storage.ts`. Don't touch
  `chrome.storage` directly elsewhere.
- Build-time only: `import.meta.env.DEV` / `.PROD` gate dev-only code (theme switcher, showcase)
  out of production. No `process.env` / `NODE_ENV` branches in shipped paths.

## Svelte

- Runes only: `$props`/`$state`/`$derived`/`$effect`. No `export let`, no `let`+`$:`, no
  `<slot/>` (use `{#snippet}`/`{@render}`), no `$app/stores`.
- Mark `$state` only on what drives reactivity. Prefer `$derived` over `$effect`. Tear down
  `addEventListener`/timeouts/storage subscriptions in `$effect` cleanup.

## Testing

Two vitest projects: **`unit`** (node) for pure logic, **`browser`**
(`@vitest/browser` + Playwright chromium via `vitest-browser-svelte`) for components +
rune-store tests, named `*.svelte.test.ts`. `pnpm test` runs both.

## Styling

- Modern CSS. Tokens as CSS custom properties; scoped `<style>` per component. No SCSS, no BEM.
- Components in `src/lib/components` are self-contained: scoped styles depending on **tokens**
  alone — never a global utility class, no hex literals. Share values via tokens, not classes.
- Tokens in `src/lib/styles/tokens.css`, lifted from the design bundle.
- Brand: **Pixel Blue `#3194FC`** for identity/links/focus only, never a status colour. Status
  palette is OKLCH; system font stack; sentence case (no all-caps).
- Respect `prefers-color-scheme` (ship both themes, no user toggle) + `prefers-reduced-motion`.
  WCAG 2.1 AA: semantic HTML, focus-visible, keyboard reachability, 4.5:1 contrast.

## Design workflow

- Design bundles land in `design/vN/`; read that bundle's `README.md` first (authoritative spec).
- Recreate surfaces as Svelte 5 components using the tokens — lift the visual treatment, not the
  markup/class names. Don't import `pipes.css` wholesale or ship the bundle HTML.
- No GitHub/GitLab brand marks in the UI (group by owner; one universal status-icon set).

## PRDs and tasks

Use the symlinked `ai-dev-tasks/create-prd.md` + `generate-tasks.md`. PRDs/task lists live in
`tasks/` as `prd-<feature>.md` / `tasks-<feature>.md`. Task lists start with
`0.0 Create feature branch`. Generate parent tasks first, wait for "Go", then sub-tasks.

## Allowed tools

`pnpm`, `node`, `bash`, `gh`, `git`, `grep`, `rm`, `cp`, `nvm`.
