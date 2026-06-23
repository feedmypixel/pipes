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

- [x] 2.0 Firefox build target + manifest
  - [x] 2.1 `vite.config.ts` reads `process.env.TARGET` (chrome|firefox, default chrome) → `crx({ browser })` + `build.outDir = dist-${target}`. Renamed the Chrome output `dist` → **`dist-chrome`** (symmetry with `dist-firefox`); updated `.gitignore`, `release.yml`, the `zip` script (`pipes-chrome.zip`), and the README load-unpacked docs.
  - [x] 2.2 FF manifest adds `browser_specific_settings.gecko` (id `pipes@feedmypixel.com`, `strict_min_version` `121.0`).
  - [x] 2.3 `background` is conditional: Chrome `service_worker`, **Firefox `scripts: [...]`** (crxjs's FF path reads `background.scripts[0]` and does NOT transform `service_worker` — declaring `service_worker` alone crashes its `renderCrxManifest`). `type: module` on both.
  - [x] 2.4 FF target swaps `side_panel` → `sidebar_action.default_panel` (same sidepanel HTML) and drops the Chrome-only `sidePanel` permission.
  - [x] 2.5 `crx({ browser: 'firefox' })` builds `dist-firefox/` (generates the background loader, strips Chrome-only fields). `pnpm build` (Chrome) + `pnpm build:firefox` both succeed; `check` green.
  - [x] 2.6 Added `build:firefox`, `build:all`, `zip:firefox` scripts.
  - [x] 2.7 Added `web-ext` dev dep. `web-ext lint -s dist-firefox`: **0 errors**, 6 expected warnings (`sidePanel.open` → 3.1, Svelte `innerHTML`, Android-only `optional_host_permissions`).

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

- [ ] 6.0 (Optional, deferred) Cross-browser smoke test
  - [ ] 6.1 **Not built for v1** — unit tests + a manual `web-ext run` pass per release cover the risk. If FF parity regressions bite post-launch, add a thin Playwright smoke: load `dist-chrome/` (load-unpacked) and `dist-firefox/` (via `web-ext`), assert each surface renders + the core poll → badge path. Skip the heavy 3-tier suite (extension e2e, esp. Firefox, is fiddly + flaky for a small client-side extension).
