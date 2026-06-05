# Pipes Roadmap

Where we are, and where we're going. The plan at a glance.

> **Pipes** is a Chrome (MV3) extension that watches GitHub Actions + GitLab CI/CD
> pipeline status across the repos you care about, and is **loud the moment the
> default branch breaks**. Fully client-side, no backend.

Legend: ✅ done · 🚧 in progress · 📝 spec'd (PRD written) · ⏳ planned

## Contents

- [Now, next, later](#now-next-later)
- ✅ [Phase 0: Engine and setup](#phase-0-engine-and-setup)
- 📝 [Phase 1: Design foundation](#phase-1-design-foundation)
- ⏳ [Phase 2: Popup and side panel](#phase-2-popup-and-side-panel)
- ⏳ [Phase 3: Options](#phase-3-options)
- ⏳ [Phase 4: Notifications and toolbar](#phase-4-notifications-and-toolbar)
- ⏳ [Phase 5: Polish](#phase-5-polish)
- ⏳ [Phase 6: Web Store release](#phase-6-web-store-release)
- [Backend work threaded through the surfaces](#backend-work-threaded-through-the-surfaces)
- [Non-goals](#non-goals)
- [How we build](#how-we-build)

---

## Now, next, later

- **Now:** land the project baseline (PR + reviewer), wire the build workflow.
- **Next:** build the Design Foundation (tokens + shared primitives), then the popup.
- **Later:** side panel, options, notifications, then polish and a Web Store release.

---

## Phase 0: Engine and setup ✅

The background half and project scaffolding. Done and type-checked.

- ✅ Provider adapters (GitHub Actions, GitLab CI) over one normalized model
- ✅ Poll loop: fetch → diff vs last snapshot → notify on transitions (loud on `main`)
- ✅ Service worker (alarms, lifecycle), typed `chrome.storage`, notifications + badge
- ✅ Toolchain: Svelte 5 + Vite + crxjs + TS, ESLint/Prettier, Vitest (15 tests)
- ✅ Renamed `pipeline-watcher` → **pipes** (repo, remote, codebase)
- ✅ Design v1 imported (`design/v1/`), conventions in `CLAUDE.md`
- 🚧 Baseline PR + CI + husky + `agent-workflow.md` (this phase's last step)

## Phase 1: Design foundation 📝

The shared layer every surface sits on. PRD: `tasks/prd-design-foundation.md`.

- Global `tokens.css` + `base.css` from `design/v1/assets/pipes.css`
- Theming: auto `prefers-color-scheme` + a dev-only switcher
- Lucide icon setup
- Shared primitives: `StatusIcon`, `Row`, `RefChip`, `RelativeTime`
- Dev-only component showcase (preview every primitive, both themes)

## Phase 2: Popup and side panel ⏳

The two list surfaces, sharing one `Row`.

- Popup (380px): dark app-bar, alarm strip ("N failing on main"), owner-grouped repos
  with the "pipe rail", secondary-branch collapse, footer live indicator
- Side panel (~360px): same rows, denser, sticky health summary, auto-refresh indicator
- States: failing (headline), pr-failing (calm), healthy, unconfigured, error
- Deep-link rows to the exact run (failures → the failed job's log)

## Phase 3: Options ⏳

Configuration. Forms follow the design's forms spec.

- Connections: list + add (host → **provider auto-detected**), token validate (shows
  authed handle), remove; self-hosted host permission requested at runtime
- Watched repositories: searchable, grouped, checkbox list from the API
- Settings: poll interval, notify-on-recovery
- Security note: tokens on-device, read-only, never synced

## Phase 4: Notifications and toolbar ⏳

- Redesigned OS notifications: status-tinted cards, actions (open failed job / snooze /
  view run), greyscale logo
- Provider-incident banner (shown only during a GitHub/GitLab incident)
- Toolbar: static green-tick icon + red badge count (icon does **not** change)

## Phase 5: Polish ⏳

- Accessibility pass (WCAG 2.1 AA), reduced-motion, keyboard
- Performance, rate-limit friendliness, error/empty-state polish
- End-to-end dogfood on real repos

## Phase 6: Web Store release ⏳

- `CHROMEWEBSTORE.md`: listing copy, permission justifications, privacy disclosure
- Privacy policy, screenshots (1280×800), store assets
- Package + submit

---

## Backend work threaded through the surfaces

The engine exists; these extensions land with the surface that needs them:

- **Provider auto-detect from host** (Phase 3): drop the provider toggle
- **Deep-link to the failed job's log line** (Phase 2): providers/poll surface job URLs
- **Provider-incident banner** (Phase 4): fetch githubstatus.com / GitLab status

## Non-goals

- No backend/server, no account system of our own (uses your PATs, read-only)
- No dynamic toolbar icon (the green tick is static; the badge signals failures)
- No GitHub/GitLab brand marks in the UI (group by owner, universal status icons)
- No writes to any provider (read-only scopes only)

---

## How we build

Per PRD: branch (task `0.0`) → implement task-by-task → tests → reviewer agent on the
diff → fix → PR → merge. See `tasks/agent-workflow.md`. PRDs and task lists live in
`tasks/`; design bundles in `design/`; conventions in `CLAUDE.md`.
