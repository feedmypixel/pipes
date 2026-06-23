# Tasks: Firefox port (one codebase, two stores)

Source PRD: [`prd-firefox-port.md`](prd-firefox-port.md)

## Relevant Files

- `src/lib/browser.ts` - **New.** Single import point re-exporting the `webextension-polyfill` `browser` (promise-based) used everywhere instead of `chrome.*`.
- `src/lib/platform.ts` - **New.** Capability/engine detection helper (e.g. `isFirefox`, `openDashboard()`); no `process.env`.
- `src/lib/storage.ts` - Storage choke point; swap `chrome.storage` → `browser.storage`.
- `src/background/service-worker.ts` - Alarms, runtime/port/notification listeners; swap to `browser.*`; must run as a FF event page.
- `src/background/poll.ts` - Poll loop; swap any `chrome.*`; unchanged logic.
- `src/lib/notify.ts` - Notifications + badge + `tabs.create`; per-engine notification options (lean on FF).
- `src/lib/live-port.ts` - Keep-alive port; swap to `browser.runtime`; validate cadence on FF event page.
- `src/lib/dashboard.svelte.ts` - `runtime.sendMessage`; swap to `browser.*`.
- `src/popup/App.svelte` - `windows.getCurrent`, open-dashboard button, `openOptionsPage`; route through `openDashboard()`.
- `src/options/App.svelte` - `permissions.request` for self-hosted; swap to `browser.permissions`.
- `src/manifest.config.ts` - Per-target manifest: `gecko.id`, dual `background`, `sidebar_action` vs `side_panel`.
- `vite.config.ts` - Read the target env; pass `browser` to crxjs; per-target `outDir`.
- `package.json` - `webextension-polyfill` + `web-ext` deps; `build:firefox` / `zip:firefox` scripts.
- `.github/workflows/release.yml` - Add the Firefox build + AMO draft-upload alongside the CWS step.
- `web-ext-config.mjs` - **New (optional).** `web-ext` run/lint/sign config for the Firefox build.
- `docs/releasing-to-chrome-web-store.md` - Extend (or add `docs/releasing.md`) for the dual-store + AMO flow.
- `README.md` / `docs/README.md` - Firefox build/run/release notes + commands.
- Test files alongside any changed `lib/*` (`*.test.ts` / `*.svelte.test.ts`) updated for the polyfilled `browser`.

### Notes

- Two vitest projects (`unit`, `browser`); run with `pnpm test`. Tests that touch `chrome.*` (or the dev mock) must follow the `chrome.*` → `browser.*` swap.
- Validate the Firefox build interactively with `web-ext run` (load `dist-firefox/`); `web-ext lint` for manifest checks.
- The Chrome `dist/` + `manifest.json` must stay byte-identical after the seam work — diff to prove it.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feat/firefox-port` off `main`.

- [ ] 1.0 Browser-API compatibility seam
  - [ ] 1.1 Add `webextension-polyfill` (+ types) as a dependency; run `pnpm security-audit`.
  - [ ] 1.2 Create `src/lib/browser.ts` re-exporting the polyfilled `browser` as the single import point.
  - [ ] 1.3 Swap `chrome.*` → `browser.*` in `lib/storage.ts` (`storage.local` get/set/remove, `onChanged`).
  - [ ] 1.4 Swap in `background/service-worker.ts` (alarms, `runtime.onConnect/onInstalled/onStartup/onMessage`, `storage.onChanged`, notification listeners) and `background/poll.ts`.
  - [ ] 1.5 Swap in `lib/notify.ts` (`notifications.create/clear`, `action` badge, `tabs.create`) and `lib/live-port.ts` (`runtime.connect`, port events).
  - [ ] 1.6 Swap in `lib/dashboard.svelte.ts`, `popup/App.svelte` (`windows.getCurrent`, `runtime.openOptionsPage`), `options/App.svelte` (`permissions.request`).
  - [ ] 1.7 Update types (drop reliance on `@types/chrome` where `browser` types now apply); `pnpm check` clean.
  - [ ] 1.8 Update affected tests + the `dev-chrome` mock to the `browser` shape; `pnpm test` green.
  - [ ] 1.9 Build Chrome and **diff `dist/` + `manifest.json` against pre-seam** to prove no Chrome change; `pnpm lint` clean.

- [ ] 2.0 Firefox build target + manifest
  - [ ] 2.1 Read a `TARGET` (chrome|firefox) env in `vite.config.ts` / `manifest.config.ts`; default chrome.
  - [ ] 2.2 For the Firefox target add `browser_specific_settings.gecko.id` (`pipes@feedmypixel.com`) + `gecko.strict_min_version` (`121.0`).
  - [ ] 2.3 Declare `background` with **both** `service_worker` and `scripts` so FF 121+ runs the event page.
  - [ ] 2.4 Replace Chrome's `side_panel` with `sidebar_action.default_panel` pointing at the existing sidepanel HTML (FF target only).
  - [ ] 2.5 Pass `browser: 'firefox'` to crxjs for the FF build (strips Chrome-only fields); output to `dist-firefox/`.
  - [ ] 2.6 Add `build:firefox` and `zip:firefox` package scripts (+ a convenience `build:all`).
  - [ ] 2.7 Add `web-ext` dev dependency; `web-ext lint dist-firefox/` clean.

- [ ] 3.0 Firefox surface + behaviour parity
  - [ ] 3.1 Add `src/lib/platform.ts` with an engine/capability check (no `process.env`) and an `openDashboard()` helper: `sidePanel.open()` on Chrome, `sidebarAction.toggle()`/`open()` on Firefox.
  - [ ] 3.2 Route the popup "open dashboard" button through `openDashboard()`.
  - [ ] 3.3 Build the notification options per engine: lean on Firefox (no `buttons`/`requireInteraction`/`contextMessage`/`priority`); keep the rich Chrome shape; guard the `onButtonClicked` path so its absence on FF is harmless.
  - [ ] 3.4 Verify the self-hosted `permissions.request({ origins })` flow works on Firefox (user gesture).
  - [ ] 3.5 Verify the `action` badge text/colour renders on Firefox.
  - [ ] 3.6 `web-ext run` the Firefox build: exercise poll → badge → notification → click-through, popup, and the sidebar dashboard; tune the live-port cadence if the event page suspends (PRD open question 3).

- [ ] 4.0 Dual-store release automation
  - [ ] 4.1 Document the AMO secrets needed (`AMO_JWT_ISSUER` / `AMO_JWT_SECRET` or API key) for `web-ext sign`; Ben adds them to repo secrets (manual, like `CWS_*`).
  - [ ] 4.2 Extend `.github/workflows/release.yml`: on a version tag, build + zip the Firefox target and **draft-upload to AMO** (`web-ext sign` / AMO submission API), draft-only.
  - [ ] 4.3 Attach a **source archive + build instructions** (Node/pnpm versions, `build:firefox` steps) for AMO review of the bundled upload.
  - [ ] 4.4 Confirm the existing CWS upload step still runs unchanged in the same workflow on the same tag.
  - [ ] 4.5 Validate the workflow without publishing (test tag on a branch / dry run); both store steps reach "draft" without auto-publish.

- [ ] 5.0 Docs + verification
  - [ ] 5.1 Extend `docs/releasing-to-chrome-web-store.md` (or add `docs/releasing.md`) for the dual-store flow, AMO secrets/setup, and `web-ext run`/`sign`.
  - [ ] 5.2 Update `README.md` + `docs/README.md`: Firefox build/run/release, the new commands, links + TOCs.
  - [ ] 5.3 Note in the listing docs that the AMO listing reuses the framed store screenshots + icon (no Firefox-specific capture).
  - [ ] 5.4 Final gates: `pnpm check`, `pnpm test`, `pnpm lint`, `pnpm security-audit`; re-confirm Chrome `dist/` unchanged; `web-ext lint` clean.
  - [ ] 5.5 Independent review (`pr-review-toolkit`) on the diff; open the PR off `main`.
