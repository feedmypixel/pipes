# Firefox Add-on (AMO) Listing: Pipes

> Last Updated: 2026-06-23

Single source of truth for the **addons.mozilla.org** listing: copy each field into the AMO Developer
Hub at submission. The Firefox counterpart of [`chromewebstore.md`](chromewebstore.md). Most copy is
shared; AMO-only fields (license, categories, reviewer notes) are called out. Release mechanics:
[`releasing-to-firefox.md`](releasing-to-firefox.md). Add-on id: `pipes@feedmypixel.com`.

## Listing

**Name**
Pipes: watch your CI/CD pipelines

**Add-on URL slug** (≤30 chars)
pipes

**Summary** (≤250 chars)
Watch GitHub Actions and GitLab CI/CD pipeline status across the repos you care about. Loud the moment a default branch breaks.

**Description** (everything inside the fence below; the field ends before Categories)

```text
Pipes watches your GitHub Actions and GitLab CI/CD pipelines and shows you the moment a default branch breaks, so you find out from your browser, not from a teammate.

Pick the repositories you care about and Pipes shows, at a glance, the status of each default branch plus its open pull requests and merge requests. When a branch you watch starts failing, you get a desktop notification and a count on the toolbar; when it goes green again, Pipes tells you that too.

Key features

- One unified view of GitHub and GitLab pipeline status, grouped by owner
- Desktop notifications the instant a default branch fails or recovers
- Open pull requests and merge requests shown with their pipeline status
- A live timer on in-progress runs, so you can see how long a build has been going
- A toolbar popup and a persistent sidebar dashboard, plus a full options page
- Self-hosted GitLab and GitHub Enterprise supported (added on demand)

How to use it

1. Add a read-only access token for GitHub (fine-grained: Actions + Pull requests) or GitLab (read_api).
2. Choose the repositories you want to watch.
3. Leave Pipes running. It polls in the background and notifies you when something breaks.

Privacy
Pipes is fully client-side. There is no Pipes server. Your token and all settings stay on your device in local storage, and your token is sent only to the Git host you connected it to. No analytics, no tracking, no third parties. Full policy: https://feedmypixel.com/pipes-feedback/privacy/
```

**Categories** (AMO taxonomy)
Web Development

**Tags**
Leave empty. AMO tags are a fixed controlled list (ad blocker, dark mode, search, vpn, etc.); none fit a CI/CD pipeline watcher.

**Contributions URL**
None (no donation page; `github.com`/Sponsors is an allowed domain if one is added later).

**Homepage**
https://github.com/feedmypixel/pipes

**Support site**
https://github.com/feedmypixel/pipes-feedback/issues

**Support email**
pipes@feedmypixel.com

**License** (AMO requires one for listed add-ons)
MIT

**Privacy Policy**
https://feedmypixel.com/pipes-feedback/privacy/

**Default locale**
English (US)

## Assets

| Asset       | Notes                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icon        | From the manifest (`icons/icon-128.png`); AMO uses it automatically.                                                                                    |
| Screenshots | Reuse `store-screenshots/framed/1-sidepanel-dark.png`, `2-author-light.png`, `3-popup-dark.png`, `4-notification.png`, `5-options-dark.png` (1280×800). |

AMO has **no promo / marquee tiles** (those are Chrome-only). The framed screenshots show the app UI,
which is identical on Firefox; the only Chrome-ism is the window-chrome titlebar reading "side panel"
(Firefox calls it the **sidebar**). Acceptable as-is; optionally regenerate a Firefox-flavoured set
later (relabel in `scripts/frame-store.mjs`). See [`screenshots.md`](screenshots.md).

**Screenshot captions** (AMO shows one per shot; optional but recommended):

1. `1-sidepanel-dark`: Every GitHub Actions and GitLab pipeline in one panel, grouped by owner.
2. `2-author-light`: Every run and PR shows who pushed it, so you know who to nudge.
3. `3-popup-dark`: A toolbar popup for a quick glance; one click through to the failing run.
4. `4-notification`: A desktop notification the instant a watched branch fails, and again when it recovers.
5. `5-options-dark`: Pick the repos to watch. Your read-only token stays on your device.

## Permissions (from the Firefox manifest)

AMO derives the prompt from the manifest; no per-permission form like Chrome's. The Firefox build's
permission set (note: **no `sidePanel`**; Firefox uses `sidebar_action`, which is not a permission):

| Permission                 | Why                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `storage`                  | Accounts, read-only token, watched repos, settings, cached status, all kept locally. |
| `alarms`                   | Schedules the periodic background poll.                                              |
| `notifications`            | Desktop notification when a watched default branch fails or recovers.                |
| `https://api.github.com/*` | Read Actions run status + open pull requests for the repos you watch.                |
| `https://gitlab.com/*`     | Read pipeline status + open merge requests for the repos you watch.                  |
| `https://*/*` (optional)   | Requested only at runtime, on a user gesture, when you add a self-hosted instance.   |

## Data collection

Same as Chrome (see [`chromewebstore.md`](chromewebstore.md)): the access token is **stored locally**
and transmitted **only** to the user's chosen Git host (GitHub/GitLab). No PII, web history, activity,
or content is collected; nothing is shared with third parties; there is no Pipes server.

Mozilla's mandatory disclosure (Nov 2025) is declared in the Firefox manifest as
`browser_specific_settings.gecko.data_collection_permissions: { required: ['none'] }`. The token goes
only to the first-party host it authenticates, so nothing is collected or transmitted to us or a third
party. (If a reviewer prefers the token declared explicitly, switch `none` to `authenticationInfo`.)

## Notes for the reviewer (source + build)

The uploaded package is a bundled build, so the AMO reviewer needs to reproduce it:

- Source: this repository at the released tag.
- Build: Node from `.nvmrc`, `pnpm` from `package.json`'s `packageManager`. Run `pnpm install` then
  `pnpm build:firefox` (output is `dist-firefox/`). Build tooling: Vite + `@crxjs/vite-plugin`.
- The "unsafe `innerHTML`" validation warnings come from the Svelte 5 compiler + `@lucide/svelte` SVG
  icons, not from us: there is no `{@html}` or manual `innerHTML` anywhere in `src/`, so no
  unsanitised or user-controlled HTML is ever assigned.
