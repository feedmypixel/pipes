# <img src="assets/logo.svg" alt="" width="34" align="top" /> Pipes

Chrome (Manifest V3) extension to watch **GitHub Actions** and **GitLab CI/CD**
pipeline status across the repos you care about, at a glance, without leaving a
tab open on the pipelines page. **Loud when the default branch breaks.**

> Status: **working.** Background engine + popup / side panel / options are built (UI recreated
> from the bundles in [`design/`](design/)). Polishing toward a Chrome Web Store release — see
> [`docs/releasing-to-chrome-web-store.md`](docs/releasing-to-chrome-web-store.md).

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Docs](#docs)
- [Develop](#develop)
- [Tokens](#tokens)
- [Notes](#notes)
- [Licence](#licence)

---

## What it does

- **Watches multiple accounts**: GitHub and GitLab, including self-hosted /
  Enterprise instances (custom origins, permission requested at runtime).
- **Pick repos from the API**: no hand-entered IDs; check the ones to watch.
- **Notifies on transitions only**: re-polling the same failure stays quiet.
  - **Default-branch failure → loud** (sticky, high-priority notification).
  - An open PR/MR's checks failing → normal toast. Recovery (red → green) → optional toast.
- **Badge**: toolbar count of currently-failing pipelines.
- **Two surfaces**: a popup for a quick glance, a side panel to keep open while
  you work. Both share one live-updating status list.
- **Read-only.** GitLab `read_api`; GitHub a read-only (fine-grained) token.
  Stored in `chrome.storage.local`, never synced, never logged.

---

## Architecture

Svelte 5 + Vite + [`@crxjs/vite-plugin`](https://crxjs.dev) + TypeScript, MV3.

```
src/
├── manifest.config.ts        # typed MV3 manifest (crxjs)
├── providers/                # normalize GitHub & GitLab into one model
│   ├── types.ts              #   Account, Repo, Pipeline, Change, Provider interface
│   ├── github.ts             #   GitHub Actions runs + open pulls
│   ├── gitlab.ts             #   GitLab pipelines + open merge requests
│   └── index.ts              #   registry + host helpers
├── lib/
│   ├── storage.ts            # typed chrome.storage wrappers + change subscribe
│   ├── group.ts              # owner/repo grouping + status view model
│   ├── live-port.ts          # keep-alive port that drives the live poll loop
│   ├── notify.ts             # notifications + toolbar badge
│   └── components/           # shared Svelte UI (RepoCard, ChangeRow, …)
├── background/
│   ├── service-worker.ts     # alarm + live-port loop, messages, lifecycle
│   └── poll.ts               # fetch → join status → diff vs snapshot → announce
├── popup/                    # glance UI
├── sidepanel/                # persistent UI
└── options/                  # accounts, repo picker, settings
```

**Data flow:** options writes `accounts` + `watchedRepos` + `settings` to `chrome.storage.local`.
The service worker polls (a `chrome.alarms` interval, or a ~10s loop while a panel is open), and per
repo fetches the **default-branch run + open PRs/MRs**, joins each PR/MR to its pipeline status by
head ref, diffs against the stored `snapshots`, fires notifications on transitions, and writes fresh
snapshots. The popup and side panel subscribe to `snapshots` and live-update.

Nothing is sent anywhere except your configured GitHub/GitLab hosts.

---

## Docs

- [`docs/faq.md`](docs/faq.md) — freshness (GitHub's ~60s cache), rate limits, token scopes, notifications.
- [`docs/releasing-to-chrome-web-store.md`](docs/releasing-to-chrome-web-store.md) — package + publish.
- [`docs/notifications.md`](docs/notifications.md) — when notifications fire + platform limits.
- [`docs/accessibility.md`](docs/accessibility.md) — WCAG 2.1 AA, the `/a11y-sweep` audit, axe-core setup.
- [`docs/README.md`](docs/README.md) — docs index (+ engineering principles, WIP).
- Styling (tokens, theming): [`src/lib/styles/README.md`](src/lib/styles/README.md).

---

## Develop

```sh
pnpm install
pnpm dev             # crxjs + Vite, HMR for the UI
pnpm build           # → dist/
pnpm check           # svelte-check / type-check
pnpm lint            # prettier --check + eslint
pnpm test            # vitest unit tests
pnpm security-audit  # pnpm audit (moderate+)
pnpm icons           # regenerate icons from scripts/generate-icons.mjs
```

### Load it into Chrome

1. `pnpm dev` (builds `dist/` and watches with hot reload).
2. `chrome://extensions` → toggle **Developer mode** (top right).
3. **Load unpacked** → select the **`dist/`** folder.

Edit a Svelte surface and it **hot-reloads** live; service-worker changes auto-reload
via crxjs. After pulling new deps or editing the manifest, hit the **reload** icon on
the extension card.

### Viewing each surface

Each surface is an HTML page, reachable two ways: loaded into Chrome (with real
`chrome.*` APIs), or as a dev-server URL in a plain browser tab (for pure-UI work).

**Loaded into Chrome** (the real thing, `chrome.*` available):

- **Popup**, click the Pipes toolbar icon.
- **Side panel**, the button in the popup.
- **Options**, right-click the toolbar icon → **Options**.

**Dev-server URLs** (`pnpm dev` running):

| Surface            | URL                                                                                              | Renders in a plain tab?                  |
| ------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Component showcase | [http://localhost:5173/src/showcase/](http://localhost:5173/src/showcase/)                       | ✅ yes — no `chrome.*`, best for styling |
| Popup              | [http://localhost:5173/src/popup/index.html](http://localhost:5173/src/popup/index.html)         | shell only                               |
| Side panel         | [http://localhost:5173/src/sidepanel/index.html](http://localhost:5173/src/sidepanel/index.html) | shell only                               |
| Options            | [http://localhost:5173/src/options/index.html](http://localhost:5173/src/options/index.html)     | shell only                               |

The real surfaces call `chrome.storage` / `alarms`, which are **undefined in a plain
tab**, so the shell loads but storage-driven content is empty. Load unpacked for the
full surface. (Loaded, the same pages live at `chrome-extension://<id>/src/...`.)

**Themes**, follows OS light/dark automatically; dev-only console override
`pipesTheme('dark' | 'light' | 'auto')` (never shipped).

---

## Tokens

| Provider | Scope                                                     | Header                  |
| -------- | --------------------------------------------------------- | ----------------------- |
| GitLab   | `read_api` (covers pipelines + merge requests)            | `PRIVATE-TOKEN`         |
| GitHub   | fine-grained: **Actions: Read** + **Pull requests: Read** | `Authorization: Bearer` |

Pipes shows each repo's default branch plus its open PRs/MRs with their pipeline status, all from
the **Actions runs** API (**Actions: Read**) keyed by the PR head SHA, plus the PR list
(**Pull requests: Read**). No **Contents** or **Checks** scope is needed — closed PRs drop off on
their own, so there are no merged/deleted-branch ghosts to filter.

Add accounts in the options page; each token is validated against the host before
it's saved. For a client/employer instance, confirm storing an instance token in a
browser extension fits their security policy, and prefer a short expiry.

**Self-hosted / Enterprise:** enter the full origin when adding the account. The
extension requests host permission at runtime (`optional_host_permissions` +
`chrome.permissions.request()`), so no manifest edit is needed.

---

## Notes

- MV3 service workers are ephemeral: polling is `chrome.alarms`-driven and all
  state (snapshots, seen-status) lives in `chrome.storage`, never memory.
- `pnpm audit` flags a high-severity issue in `rollup@2.79.2`, a **dev-only**
  transitive dep of `@crxjs/vite-plugin`, not shipped in the extension. The patch
  jumps rollup to a major crxjs can't take, so the advisory (`GHSA-mw96-cpmx-2vgc`)
  is explicitly ignored via `pnpm.auditConfig.ignoreGhsas` in `package.json`.
  Revisit when crxjs updates its rollup dependency.

## Licence

MIT.
