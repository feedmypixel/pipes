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
- The Chrome `manifest.json` is unchanged by the seam; `dist/` only gains the tiny `browser.ts` Proxy, and Chrome behaviour is identical (`check` + `test` + `build` green).

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git checkout -b feat/firefox-port` off `main`.

- [x] 1.0 Browser-API compatibility seam
  - [x] 1.1 `src/lib/browser.ts`: a Proxy seam resolving `globalThis.browser ?? globalThis.chrome` per access. No `webextension-polyfill` — Chrome MV3 `chrome.*` is already promise-based and Firefox `browser.*` is native; the polyfill's throwing import + callback-wrapping fought the dev mock and the test stubs, so it was dropped (and removed from deps).
  - [x] 1.2 Swap `chrome.*` → `browser.*` in `lib/storage.ts` (storage get/set/remove + `onChanged`), `background/service-worker.ts` (alarms, runtime, `storage.onChanged`), `lib/live-port.ts` (`runtime.connect`), `lib/dashboard.svelte.ts` (`runtime.sendMessage`), `popup/App.svelte` + `sidepanel/App.svelte` (`runtime.openOptionsPage`), `options/App.svelte` (`permissions.request`).
  - [x] 1.3 Per-call resolution means the existing `chrome` test stubs keep working unchanged; `check` + `test` (179) + `lint` + Chrome `build` all green.
  - [x] 1.4 Rename `dev-chrome.ts` → `dev-extension.ts` (cross-browser intent) + update the 3 entry imports and docs. Reword the options page's user-facing "stored via chrome.storage.local" copy to browser-neutral.
  - [ ] 1.5 **Deferred to 3.x (needs FF testing):** `lib/notify.ts` + the `notifications.*` listeners in `service-worker.ts` stay on `chrome.*` until the FF degrade (3.3); `popup/App.svelte`'s `windows.getCurrent` + `sidePanel.open` stay on `chrome.*` until the platform `openDashboard()` helper (3.1). Drop `@types/chrome` once no `chrome.*` runtime refs remain (the `chrome.runtime.Port` / `chrome.storage.StorageChange` type names stay — they are the standard `@types/chrome` shapes the seam is typed against).

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

- [ ] 6.0 Cross-browser e2e tests (Chrome + Firefox)
  - [ ] 6.1 **Tier 1 (both engines, UI):** a Playwright project that drives the dev-mock surface pages (`/src/popup|sidepanel|options/index.html`) in **Chromium and Firefox**, asserting the rendered dashboard, filters, and author rows. Reuses the `dev-extension` scene + the capture infra; proves the seam + surfaces render on both engines.
  - [ ] 6.2 **Tier 2 (Chrome, full extension):** Playwright `launchPersistentContext` with the unpacked `dist/` loaded; e2e the real flow — storage write → background poll → badge → popup → open side panel.
  - [ ] 6.3 **Tier 3 (Firefox, smoke):** Playwright can't load FF extensions directly, so a `web-ext run`-driven smoke (or deferred) that loads `dist-firefox/` and checks the surfaces + that the background event page registers. Document the limitation if deferred.
  - [ ] 6.4 Wire the e2e into CI (a job that builds both targets and runs the tiers); keep it separate from the fast unit `pnpm test`.
