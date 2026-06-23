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

- [x] 3.0 Firefox surface + behaviour parity (code; FF interactive checks are Ben's gate)
  - [x] 3.1 `src/lib/platform.ts`: `isFirefox()` + `openDashboard()` via **feature detection** (no `process.env`) — `browser.sidebarAction` exists only on Firefox, so `openDashboard()` does `sidebarAction.toggle()` on FF, else `browser.sidePanel.open()` on Chrome.
  - [x] 3.2 Popup routes its open button through `openDashboard()` (+ `window.close()`); button relabelled "Open dashboard". No `chrome.*` left in the popup.
  - [x] 3.3 `notify.ts` + the `service-worker.ts` notification listeners now use the seam. FF gets **lean** options (drop `contextMessage`/`buttons`/`priority`/`requireInteraction` via a per-call spread); `onButtonClicked` is guarded with `?.` (Firefox omits it). Badge uses `browser.action`. **Every runtime `chrome.*` call is now on the seam** — only comments/`@types/chrome` type names remain.
  - [ ] 3.4 (Ben, `web-ext run`) verify the self-hosted `permissions.request` flow on Firefox.
  - [ ] 3.5 (Ben, `web-ext run`) verify the badge renders on Firefox.
  - [ ] 3.6 (Ben, `web-ext run`) exercise poll → badge → notification → click-through, popup, sidebar; tune the live-port cadence if the FF event page suspends (PRD open question 3). Note: `web-ext lint` still warns on `sidePanel.open` — it's in the shared bundle but guarded (never runs on FF).

- [x] 4.0 Dual-store release automation
  - [x] 4.1 AMO secrets documented in `docs/releasing-to-firefox.md`; Ben added `AMO_JWT_ISSUER` + `AMO_JWT_SECRET` to repo secrets.
  - [x] 4.2 `release.yml` gains `gate-firefox` + `submit-firefox` jobs: on a tag, `pnpm build:firefox` then `web-ext sign --channel=listed` submits to AMO, gated on `AMO_*` (mirrors the CWS gate). First run creates the add-on from `gecko.id`.
  - [x] 4.3 Source + build-instructions for AMO review documented (doc "AMO review notes"); the actual source attach is a dashboard step.
  - [x] 4.4 The CWS `gate` + `upload` jobs are untouched; both stores run off the same tag.
  - [ ] 4.5 (Ben) validate end to end on the first real tag — both stores reach the store without auto-going-live.

- [x] 5.0 Docs + verification
  - [x] 5.1 Added `docs/releasing-to-firefox.md` (account, API keys + direct link, build, `web-ext run`, the wired AMO release, first-listing dashboard step, review notes).
  - [x] 5.2 `README.md` + `docs/README.md`: Firefox build/run/release, `build:firefox`, the load-into-Firefox section, links + TOCs.
  - [x] 5.3 Listing reuses the framed store screenshots + icon (no FF-specific capture) — noted in the release doc.
  - [x] 5.4 Gates green throughout: `check`, `test` (179), `lint`, `security-audit`, both builds, `web-ext lint` 0 errors. Chrome manifest unchanged.
  - [x] 5.5 Independent review on the 3.0 diff (clean). PR #119 open off `main` (tasks 1.0-5.0).

- [ ] 6.0 (Optional, deferred) Cross-browser smoke test
  - [ ] 6.1 **Not built for v1** — unit tests + a manual `web-ext run` pass per release cover the risk. If FF parity regressions bite post-launch, add a thin Playwright smoke: load `dist-chrome/` (load-unpacked) and `dist-firefox/` (via `web-ext`), assert each surface renders + the core poll → badge path. Skip the heavy 3-tier suite (extension e2e, esp. Firefox, is fiddly + flaky for a small client-side extension).
