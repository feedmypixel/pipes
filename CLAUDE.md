# CLAUDE.md

Guidance for Claude Code in the **Pipes** repo. The global `~/.claude/CLAUDE.md` holds
the universal principles (simplicity, go-slow, YAGNI, surgical changes, consistency,
comments, brevity, testing prefs, no-disabled-buttons UX, pre-commit gates, git hygiene).
This file is only what is specific to Pipes. Do not duplicate the global.

## What Pipes is

Chrome (Manifest V3) extension. Watches GitHub Actions + GitLab CI/CD pipeline status
across chosen repos; loud the moment the default branch breaks. **Fully client-side, no
backend or server**: it calls provider APIs directly from the extension using the user's
read-only token, and keeps all state in `chrome.storage`.

## Stack

- Svelte 5 (runes) + Vite 8 + `@crxjs/vite-plugin` (typed MV3 manifest + HMR) + TypeScript
- `@lucide/svelte` for icons
- Vitest 4 (unit), ESLint flat config + Prettier + eslint-plugin-svelte + eslint-plugin-security
- `sharp` rasterizes the logo into icon PNGs
- **Not SvelteKit.** No server, SSR, routes, adapter, `$env`, `$app`, zod, Playwright, husky.

## pnpm only

`pnpm` (pinned in `.npmrc`, Node in `.nvmrc`; `nvm use` first). After installs run
`pnpm security-audit`.

## Commands

```bash
pnpm dev             # crxjs + Vite, builds dist/ with HMR
pnpm build           # production build → dist/
pnpm check           # svelte-check / type-check
pnpm lint            # prettier --check . && eslint .
pnpm format          # prettier --write .
pnpm test            # vitest run
pnpm test:watch      # vitest
pnpm security-audit  # pnpm audit --audit-level=moderate
pnpm icons           # rasterize design logo → icons/*.png
```

## Layout

```
src/
├── manifest.config.ts     # typed MV3 manifest (crxjs)
├── providers/             # normalize GitHub + GitLab into one model
│   ├── types.ts           #   Account, Repo, Pipeline, Provider interface
│   ├── github.ts          #   GitHub Actions runs API
│   ├── gitlab.ts          #   GitLab pipelines API
│   └── index.ts           #   provider registry + host helpers
├── lib/
│   ├── storage.ts         # typed chrome.storage wrappers + change subscribe
│   ├── notify.ts          # notifications + toolbar badge
│   ├── components/         # shared Svelte primitives (StatusIcon, Row, RefChip, …)
│   └── styles/            # tokens.css (+ base) lifted from the design bundle
├── background/            # service-worker.ts (lifecycle) + poll.ts (fetch→diff→notify)
├── popup/ · sidepanel/ · options/   # the three HTML surface entries
design/                    # versioned design bundles (design/vN) — not built/shipped
tasks/                     # PRDs + task lists (ai-dev-tasks workflow)
scripts/ · icons/
```

## Extension specifics (MV3)

- The service worker is **ephemeral** (killed after ~30s idle). Keep **no state in module
  globals**: persist via `chrome.storage`, schedule via `chrome.alarms`, and register all
  listeners synchronously at the top level so a restarted worker still receives events.
- Tokens (PATs) are **read-only**, stored in `chrome.storage.local`, never synced, never
  logged. GitLab `read_api`; GitHub a read-only fine-grained token.
- `host_permissions` covers SaaS hosts; self-hosted / Enterprise origins are requested at
  runtime via `optional_host_permissions` + `chrome.permissions.request()` on a user gesture.
- Providers normalize GitHub + GitLab into one model. Adding a provider = a new adapter
  implementing the `Provider` interface, registered in `providers/index.ts`.
- UIs subscribe to the `snapshots` key in `chrome.storage`; the service worker polls, diffs
  against the last snapshot, notifies on transitions, and sets the badge.
- **The toolbar icon is the static green tick and never changes.** The failure signal is the
  red badge count, not the icon.

## TypeScript

- Implicit types; annotate only when inference fails. No `@ts-expect-error`.
- Prefer named files over barrels. A small registry module (`providers/index.ts`) is fine;
  don't add pure re-export barrels.

## JavaScript / Svelte

- `const` by default; `let` only when reassignment is unavoidable. ES modules, destructured
  imports, functional over OOP.
- Svelte 5 **runes only**: `$props`/`$state`/`$derived`/`$effect`. No `export let`, no
  `let`+`$:`, no `<slot/>` (use `{#snippet}`/`{@render}`), no `$app/stores`.
- Mark `$state` only on what drives reactivity. Prefer `$derived` over `$effect`; `$effect`
  is rare. Tear down `addEventListener`/timeouts/storage subscriptions in `$effect` cleanup.

## Testing

- Vitest globals enabled: do not import `describe`/`test`/`expect`. Use `test`, not `it`.
- Tests sit beside source (`foo.ts` ↔ `foo.test.ts`). Light types in tests.
- Pure logic is unit-tested (provider status maps, poll decisions). Component tests arrive
  with `@vitest/browser` when surfaces land; don't add the browser project before then.

## Styling

- Modern CSS. Tokens as CSS custom properties; scoped `<style>` per component. No SCSS, no BEM.
- **Component / utility boundary:** components in `src/lib/components` are self-contained
  (scoped styles only) and depend on **tokens** alone. Never apply a global utility class
  inside a component; it must render correctly with zero global classes. Share values across
  components via tokens, not shared classes.
- Tokens live in `src/lib/styles/tokens.css`, lifted verbatim from the current design bundle
  (`design/v1/assets/pipes.css`). No hex literals in component scoped styles.
- Brand: **Pixel Blue `#3194FC`** for identity/links/focus only, never a status colour. Status
  palette is OKLCH; cool-slate neutrals; system font stack; no all-caps (sentence case).
- Respect `prefers-color-scheme` (ship both themes, no user-facing toggle; a dev-only switcher
  previews them) and `prefers-reduced-motion`. WCAG 2.1 AA: semantic HTML, focus-visible,
  keyboard reachability, 4.5:1 contrast.

## Design workflow

- Design bundles (claude.ai/design) land in `design/vN/`. Read that bundle's `README.md`
  first — it is the authoritative spec. `design/README.md` is the version index/changelog.
- Recreate surfaces as Svelte 5 components using the global tokens. Lift the visual treatment,
  not the markup or class names. Don't import `pipes.css` wholesale; don't ship the bundle HTML.
- No GitHub/GitLab brand marks in the UI (group by owner; one universal status-icon set).

## PRDs and tasks

- Use the symlinked `ai-dev-tasks/create-prd.md` + `ai-dev-tasks/generate-tasks.md`. PRDs and
  task lists live in `tasks/` as `prd-<feature>.md` / `tasks-<feature>.md`, referencing
  `design/vN/` paths. Task lists start with `0.0 Create feature branch`. Generate parent tasks
  first, wait for the user's "Go", then sub-tasks. Check sub-tasks off as completed.

## PR review gate

Before opening a PR with code changes, pass three layers: **mechanical** (check, lint, test,
security-audit), **functional** (load unpacked, exercise the surface), and an **independent
reviewer agent** (`pr-review-toolkit:code-reviewer`) on the diff. Apply HIGH and MEDIUM
findings; defer LOW with a reason in the PR description.

## Allowed tools

`pnpm`, `node`, `bash`, `gh`, `git`, `grep`, `rm`, `cp`, `nvm`.
