# Tasks: Replace token

From `prd-replace-token.md`. Design contract: `design/v6/REPLACE-TOKEN.md`.

## Relevant Files

- `src/providers/http.ts` - `HttpError` (status) for non-2xx responses.
- `src/providers/types.ts` - `Account.user`, `ValidationResult.status`.
- `src/providers/github.ts` / `gitlab.ts` - `validateToken` returns the status.
- `src/providers/index.ts` - `providerName()` display helper.
- `src/lib/storage.ts` - `AccountHealth.status`.
- `src/lib/health.ts` - `isTokenFailure()`.
- `src/background/poll.ts` - store the status in health; forced poll queued behind an in-flight one.
- `src/lib/components/forms/MessageIcon.svelte` - v2 solid variants.
- `src/lib/components/Banner.svelte` / `Toast.svelte` - icon sizes.
- `src/lib/components/TopAlerts.svelte` - token-failure strip with a Replace token action.
- `src/lib/dashboard.svelte.ts` - `connectionIssues` carry `tokenFailure`.
- `src/lib/options-link.ts` - open/focus Options at `#replace={id}`.
- `src/sidepanel/App.svelte` / `src/popup/App.svelte` - pass `onReplaceToken`.
- `src/options/replace-token.ts` - pure helpers (hash parsing, outcome, copy).
- `src/options/TokenHelp.svelte` - shared token-permissions disclosure.
- `src/options/ConnectionRow.svelte` - row + inline replace form.
- `src/options/App.svelte` - health subscription, `Account.user` on add, replace + add-as-new wiring, deep link.
- `src/lib/dev-extension.ts` - shim `runtime.getURL` + `extension.getViews`.
- `src/showcase/Showcase.svelte` - new states.

### Notes

- Tests sit next to source (`*.test.ts` node, `*.svelte.test.ts` browser). Use `test`.
- Gate: `pnpm check && pnpm lint && pnpm test:coverage && pnpm build`, then `pnpm security-audit`.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git switch -c feat/replace-token` off an up-to-date `main`

- [x] 1.0 Typed auth failures
  - [x] 1.1 `HttpError` with `status` in `http.ts` (same message text); test
  - [x] 1.2 `ValidationResult.status`; GitHub + GitLab `validateToken` pass it through; tests
  - [x] 1.3 `AccountHealth.status`; `poll.ts` stores it; `isTokenFailure()` in `src/lib/health.ts`; tests
  - [x] 1.4 Forced poll requested mid-cycle runs a fresh forced cycle afterwards; test

- [x] 2.0 Account identity
  - [x] 2.1 `Account.user?`; capture it on add in Options

- [x] 3.0 MessageIcon v2
  - [x] 3.1 Solid variants (success, error, warning, info, token-ok, token-bad, lock); test
  - [x] 3.2 Banner 16px, Toast 18px; Options security note uses `lock`

- [x] 4.0 Replace token in Options
  - [x] 4.1 Pure helpers in `replace-token.ts` (outcome, note copy, hash target); tests
  - [x] 4.2 Extract `TokenHelp.svelte`; use it in the add form
  - [x] 4.3 `ConnectionRow.svelte`: healthy / failing / replaced states, key + bin buttons with tooltips
  - [x] 4.4 Inline form: validate, save, cancel/Esc, banners, summary, focus management; tests
  - [x] 4.5 App: subscribe to health, one row open at a time, save → accounts + health + repos + poll-now + toast
  - [x] 4.6 "Add it as a new connection instead" → prefill + scroll to the add form

- [x] 5.0 Panel banner + deep link
  - [x] 5.1 `connectionIssues[].tokenFailure`; TopAlerts status strip + Replace token action; tests
  - [x] 5.2 `openReplaceToken(id)`: reuse an open Options tab or open one at `#replace={id}`; wire both surfaces
  - [x] 5.3 Options handles `#replace=` on load + `hashchange`: open, scroll, focus, flash, clear hash
  - [x] 5.4 DEV shim: `runtime.getURL`, `extension.getViews`

- [x] 6.0 Showcase + verification
  - [x] 6.1 Showcase: TopAlerts token-failure strip, new MessageIcon variants
  - [x] 6.2 Gates (check, lint, coverage, build, audit)
  - [x] 6.3 Functional: options + panel in the browser (dev), light + dark
  - [x] 6.4 Independent review agents on the diff; fix findings
