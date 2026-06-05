# GitLab Pipeline Watcher

A small Chrome (Manifest V3) extension to see GitLab CI/CD **pipeline failures at a glance**, across the projects you
care about — without leaving a tab open on the pipelines page or living in the terminal.

> Status: **scaffold**. The skeleton works end to end (configure → poll → popup + desktop notifications), but it's
> deliberately minimal and meant as a starting point. See [Roadmap](#roadmap).

---

## What it does today

- **Popup**: click the toolbar icon to see currently-failing pipelines across your watched projects, newest first, each
  linking straight to the pipeline page.
- **Background polling**: a service worker polls GitLab every 5 minutes (`chrome.alarms`) and fires a **desktop
  notification** when a watched project's pipeline *newly* enters the failed state. Clicking the notification opens the
  pipeline.
- **Badge**: the toolbar icon shows a count of current failures.
- **Settings page**: configure your GitLab host, a `read_api` token, and the project IDs to watch.

Works against **gitlab.com** out of the box and **self-hosted** instances with one manifest tweak (see below).

---

## Architecture

Plain Manifest V3, vanilla JS, no build step — so you can load it unpacked and iterate immediately. ES modules are used
throughout (`"type": "module"` on both the service worker and the page scripts) so the GitLab client is shared cleanly.

```
gitlab-pipeline-watcher/
├── manifest.json              # MV3 manifest: permissions, action, options, background
├── package.json               # optional scripts (lint placeholder, zip for packaging)
├── icons/                     # PNG icons (see icons/README.md)
└── src/
    ├── lib/
    │   └── gitlab.js           # read-only GitLab REST client + storage helpers
    ├── background/
    │   └── service-worker.js   # alarm-driven polling, notifications, badge
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js            # fetch failures, render list
    └── options/
        ├── options.html
        ├── options.css
        └── options.js          # read/write config to chrome.storage.local
```

**Data flow**: `options.js` writes `{ baseUrl, token, projectIds }` to `chrome.storage.local`. Both `popup.js` and
`service-worker.js` read that config via `lib/gitlab.js`, which wraps
the [Pipelines API](https://docs.gitlab.com/ee/api/pipelines.html) (`GET /projects/:id/pipelines?status=failed`).
Nothing is sent anywhere except your configured GitLab host.

---

## Install (development)

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top right).
3. Click **Load unpacked** and select this folder.
4. Click the extension's **Details → Extension options** (or the *Settings* link in the popup) and fill in:
    - **GitLab host** — `https://gitlab.com` or your self-hosted origin.
    - **Personal access token** — see below.
    - **Project IDs** — the numeric IDs of the projects to watch, comma-separated. The ID is shown on each project's
      home page beneath its name.

Changes to source: hit the **reload** icon on the extension card in `chrome://extensions` to pick them up. (Editing the
popup/options and reopening them is enough for those; service-worker changes need the reload.)

---

## Creating the token

Create a **Personal Access Token** in GitLab (User Settings → Access Tokens) with **only** the `read_api` scope. That's
sufficient for read-only pipeline monitoring — don't grant `api` or anything wider.

The token is stored in `chrome.storage.local` and is sent only to your configured GitLab host, as the `PRIVATE-TOKEN`
header. It is never logged.

> **If this is for a client/employer instance**: check that storing an instance token in a browser extension is within
> their security policy *before* you wire it up, and prefer a short expiry on the token.

---

## Self-hosted GitLab

Two changes:

1. Set the host in **Settings** to your origin (e.g. `https://gitlab.example.com`).
2. Add that origin to `host_permissions` in `manifest.json`:

   ```json
   "host_permissions": [
     "https://gitlab.com/*",
     "https://gitlab.example.com/*"
   ]
   ```

   (Or switch to `optional_host_permissions` + `chrome.permissions.request()` if you'd rather ask at runtime — a nice
   future improvement.)

---

## Roadmap

Rough order of usefulness — pick whatever's itching:

- [ ] **Per-job drill-down** — expand a failed pipeline to show which job/stage broke (`listPipelineJobs` is already in
  `lib/gitlab.js`).
- [ ] **Watch by group, not just project IDs** — list a group's projects via the API instead of hand-entering IDs.
- [ ] **Filter to your own MRs / branches** — only notify for pipelines on refs you authored.
- [ ] **Configurable poll interval & quiet hours** in settings.
- [ ] **Runtime host permissions** (`optional_host_permissions`) so self-hosted doesn't need a manifest edit.
- [ ] **Status filter** in the popup (failed / running / all), not just failed.
- [ ] **Build tooling** — if it grows, add Vite + a bundler. The structure is bundler-ready; entry points are the three
  HTML files plus the service worker.
- [ ] **TypeScript** — `lib/gitlab.js` has JSDoc typedefs as a stepping stone; converting is low-friction.
- [ ] **Tests** — extract the pure bits of `lib/gitlab.js` (URL building, response shaping) and unit test them; mock
  `fetch`.
- [ ] **Icons** — see `icons/README.md`.
- [ ] **Lint/format** — wire up the `npm run lint` placeholder (eslint + prettier).

### Possible bigger directions

- A **GraphQL** client instead of REST — fewer round-trips when fetching project + pipelines + jobs together; GitLab's
  GraphQL API is well-suited to this.
- Rate-limit awareness — debounce/cache so multiple watched projects don't hammer the API.
- Cross-browser — the MV3 surface is close enough to Firefox that a polyfill could get you both.

---

## Notes / gotchas

- **MV3 service workers are not persistent.** They get suspended; that's why polling is driven by `chrome.alarms` rather
  than `setInterval`, and why "already notified" state lives in `chrome.storage` rather than memory.
- **`per_page` caps at 100** on the GitLab API; the scaffold fetches only the latest 5 failed pipelines per project for
  the notification path.
- **Notifications** require the `notifications` permission (declared) and the OS allowing Chrome notifications.

---

## Licence

MIT.
