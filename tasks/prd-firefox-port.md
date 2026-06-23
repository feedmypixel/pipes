# PRD: Firefox port (one codebase, two stores)

## Introduction / Overview

Pipes ships only to Chrome today. This feature makes it **build and release for Firefox too, from
the same codebase** — no separate fork. We keep the existing crxjs/Vite setup and add a **Firefox
build target** (crxjs v2 supports `browser: 'firefox'`), a thin browser-API compatibility seam, a
Firefox-shaped manifest, and an **automated AMO draft-upload** in CI that mirrors the current Chrome
Web Store flow.

The product stays the same on both browsers: pick repos, poll in the background, go loud when a
watched default branch breaks. Firefox has a few platform gaps (no side-panel API, leaner
notifications) that we map or degrade — documented below — without changing the Chrome behaviour.

Scope: **desktop Firefox (121+) only**. Approach decided as **Path A (incremental, keep crxjs)** over
a WXT migration.

## Goals

1. Produce a **signed, installable Firefox (MV3) build** of Pipes from the existing codebase, with no
   regression to the Chrome build.
2. Keep **one source tree**: shared providers, surfaces, and background logic; only a thin seam and a
   per-target manifest differ between Chrome and Firefox.
3. Deliver the **core loop on Firefox**: background poll → red badge count → desktop notification →
   click-through to the run, plus the popup and a persistent sidebar dashboard.
4. **Automate the Firefox release** in CI: a pushed tag draft-uploads to **both** stores (CWS as now,
   AMO new), mirroring the existing draft-only flow.
5. Reuse the existing brand **store screenshots** for the AMO listing (the framing pipeline is
   browser-agnostic).

## User Stories

- As a Firefox user, I want to **install Pipes from addons.mozilla.org** and get the same
  pick-repos → loud-when-main-breaks experience Chrome users get.
- As a Firefox user, I want a **persistent sidebar dashboard** I can keep open while I work, like the
  Chrome side panel.
- As the maintainer, I want **one `git tag` to draft a release to both stores**, so dual-store upkeep
  isn't double the work.
- As the maintainer, I want the **Chrome build untouched** — same tests, same output — so adding
  Firefox carries no Chrome risk.

## Functional Requirements

1. **Two build targets from one source.** A target switch (e.g. `TARGET=firefox`) must make the build
   emit a Firefox-valid bundle + manifest into a separate output (e.g. `dist-firefox/`), while the
   default build stays Chrome and byte-for-byte unchanged. Add `build:firefox` + a `zip:firefox`
   script alongside the existing ones.
2. **Browser-API seam.** All extension API access must go through a **promise-based `browser.*`**
   (via `webextension-polyfill`) so the same code runs on both engines (Chrome's `chrome.*` is
   promise-capable; Firefox's `chrome.*` is callback-style, so the polyfill is required). Replace the
   direct `chrome.*` calls in the audited files: `lib/storage.ts`, `background/service-worker.ts`,
   `background/poll.ts` (if any), `lib/notify.ts`, `lib/live-port.ts`, `popup/App.svelte`,
   `options/App.svelte`, `lib/dashboard.svelte.ts`. Behaviour on Chrome must be unchanged.
3. **Firefox manifest.** For the Firefox target the manifest must:
   1. add `browser_specific_settings.gecko.id` (`pipes@feedmypixel.com`) and
      `gecko.strict_min_version` (`121.0`);
   2. declare `background` with **both** `service_worker` and `scripts` (FF 121+ runs the script as an
      event page; Chrome uses the service worker);
   3. replace Chrome's `side_panel` with `sidebar_action.default_panel` pointing at the **same**
      sidepanel HTML;
   4. drop Chrome-only fields crxjs strips for Firefox; keep `permissions`, `host_permissions`,
      `optional_host_permissions`, `action`, `options_ui`, `web_accessible_resources` working on FF.
4. **Background as event page.** The background must function on a Firefox **non-persistent event
   page**: all listeners registered synchronously at top level (already true), alarm reschedule on
   interval change, and the live-port reconnect loop all working. Confirm the ~10s live poll loop
   behaves on FF (tune if the event page suspends differently).
5. **Sidebar dashboard.** The persistent dashboard must open on Firefox via the **sidebar**
   (`browser.sidebarAction`), reusing the existing sidepanel surface unchanged. The popup's "open
   dashboard" button must call the right API per engine: `sidePanel.open()` on Chrome,
   `sidebarAction.toggle()`/`open()` on Firefox, behind a single helper.
6. **Notifications degrade on Firefox.** On Firefox the notification options must be sent **lean** —
   no `buttons`, `requireInteraction`, `contextMessage`, or `priority` (unsupported). The core
   notification (title, message, icon, click-to-open-run) and the **red badge count** must still
   fire; the badge is the durable failure signal. The `onButtonClicked` path must be guarded so its
   absence on FF is harmless.
7. **Self-hosted origins.** The runtime `permissions.request({ origins })` flow for self-hosted
   GitLab/GitHub Enterprise must work on Firefox (user-gesture initiated, via `optional_host_permissions`).
8. **Badge + toolbar.** `action` badge text/colour must render on Firefox; the toolbar icon stays the
   static green tick (unchanged on both).
9. **Automated AMO release.** The release workflow must, on a pushed version tag, build + zip the
   Firefox target and **draft-upload to AMO** (e.g. `web-ext sign` / the AMO submission API), gated on
   new AMO secrets, draft-only (no auto-publish) like the CWS step. The Chrome upload step must keep
   working unchanged in the same workflow.
10. **AMO reviewability.** Because the uploaded bundle is built, the submission must include what AMO
    review needs: a **source archive + build instructions** (Node/pnpm versions, `build:firefox`
    steps) so a reviewer can reproduce the bundle.
11. **Listing assets.** The AMO listing must reuse the existing framed **store screenshots** + icon;
    no Firefox-specific capture is required (the screenshot pipeline is browser-agnostic).
12. **Docs.** `docs/releasing-to-chrome-web-store.md` (or a sibling) and the READMEs must cover the
    Firefox build, `web-ext run` for local testing, the AMO secrets, and the dual-store release.
13. **No Chrome regression.** `pnpm check`, `pnpm test`, `pnpm lint` must pass; the Chrome `dist/` and
    manifest must be unchanged by the seam/polyfill work.

## Non-Goals (Out of Scope)

- **Firefox for Android** — desktop only this round (its sidebar/UX and testing differ).
- **Edge / Safari** and a **WXT migration** — the cleaner multi-browser path, but a separate, larger
  decision; not done here.
- **Replacing crxjs** or restructuring entry points.
- **New product features or UI redesign** — parity, not new surfaces.
- **A Firefox-specific screenshot set** — reuse the existing framed assets.
- **Auto-publishing** to either store — both stay draft-only, published by hand.

## Design Considerations

- The Firefox **sidebar is a persistent left dock** — a natural home for the keep-open dashboard; same
  HTML/Svelte, no redesign. It opens from the popup button (and Firefox's own sidebar toggle).
- The **toolbar icon stays the static green tick**; the **red badge count is the failure signal** on
  both engines (works on Firefox).
- **Light + dark** follow `prefers-color-scheme` on Firefox as on Chrome; no user toggle.
- No GitHub/GitLab brand marks; group by owner — already in place, unchanged.

## Technical Considerations

- **crxjs v2** exposes a `browser` target option that transforms the background block and strips
  Firefox-incompatible fields (e.g. `use_dynamic_url`) and expects `gecko.id`. Drive it from the
  build env so one config emits both manifests.
- Add **`webextension-polyfill`** (+ its types) and import a single `browser` in the seam. Keep
  `lib/storage.ts` as the storage choke point; the other files swap `chrome.` → `browser.`.
- **Notifications** need a per-engine option shape — build the lean object on Firefox; keep the rich
  one on Chrome. A small `isFirefox`/capability check (not `process.env`) gates it.
- **Background**: list both `service_worker` and `scripts`; verify no SW-only globals are introduced
  later (none today). Event-page suspension may affect the live-port cadence — validate with
  `web-ext run`.
- **Tooling**: `web-ext` for local run + signing; AMO API credentials as CI secrets (mirror the
  `CWS_*` set). The `dev-chrome` mock + screenshot pipeline are unaffected.
- **Versioning**: Firefox build tracks the same `package.json` version as Chrome (single source).

## Success Metrics

- A **signed Firefox build installs** and runs: background poll → badge → notification →
  click-through, plus popup and sidebar dashboard, all working on desktop Firefox 121+.
- **One tag drafts both stores** (CWS + AMO) via CI, draft-only.
- **Chrome is provably unchanged**: tests green, `dist/` + manifest identical to pre-port.
- Dual-store upkeep is **one source change**, not two.

## Open Questions

1. **AMO add-on id** — confirm `pipes@feedmypixel.com` (vs a UUID).
2. **`strict_min_version`** — 121.0 (background event-page-with-service_worker behaviour) unless we
   find an API we use needs higher.
3. **Live-port cadence on the FF event page** — does the ~10s open-dashboard loop hold, or does the
   event page suspend and need an alarm-backed nudge? Decide during task 4 with `web-ext run`.
4. **AMO source-review path** — confirm the exact source-archive + build-instructions format AMO wants
   for the bundled upload.
