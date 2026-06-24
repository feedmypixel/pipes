# Releasing to Firefox (addons.mozilla.org)

Pipes ships from **one codebase** to two stores. This is the Firefox / AMO side; the Chrome side is
[`releasing-to-chrome-web-store.md`](releasing-to-chrome-web-store.md). The build target is selected
by the `TARGET` env var, so the same source produces a Chrome bundle (`dist-chrome/`) and a Firefox
bundle (`dist-firefox/`).

Scope: **desktop Firefox 121+**. Add-on id `pipes@feedmypixel.com` (set in the manifest via
`browser_specific_settings.gecko`).

## One-time setup

1. **Create a Firefox Add-on developer account** at <https://addons.mozilla.org>, sign in with a
   Firefox account and register as a developer. **Free** (unlike Chrome's one-off $5).
2. **Generate API credentials** for signing/uploading at
   <https://addons.mozilla.org/developers/addon/api/key/> (it's in the **Developer Hub** →
   **Tools → Manage API Keys**, not the main-site Tools menu). First visit: **read + accept the
   agreement** on that page, then **Generate new credentials** appears. Copy the **JWT issuer** and
   the **JWT secret** (the secret is shown once).
3. **Add them as GitHub repo secrets** (Settings → Secrets and variables → Actions), mirroring the
   `CWS_*` set:
   - `AMO_JWT_ISSUER`
   - `AMO_JWT_SECRET`

## Build + test locally

```sh
nvm use
pnpm build:firefox          # → dist-firefox/  (TARGET=firefox vite build)
pnpm exec web-ext lint -s dist-firefox    # 0 errors expected
pnpm exec web-ext run -s dist-firefox     # launches Firefox with the extension loaded
```

`web-ext run` opens a temporary Firefox profile with Pipes installed; use it to click through the
popup, the **sidebar** (Firefox's equivalent of the Chrome side panel), and the options page, and to
confirm the badge + a notification fire. The dashboard lives in the **sidebar** on Firefox
(`sidebar_action`), not a side panel.

Known Firefox differences (by design):

- Notifications are **leaner**: no sticky/`requireInteraction`, no action buttons. The toast + the
  red badge count still fire; the badge is the durable failure signal.
- The persistent dashboard is the **sidebar**, opened from the popup's **Open dashboard** button or
  Firefox's own sidebar button.

## Release

Cutting a version is the same single step as today (`pnpm release` → tag → push); the tag's CI
submits to **both** stores.

```sh
pnpm release                       # bumps version, writes CHANGELOG, tags vX.Y.Z
git push --follow-tags origin main # the tag fires .github/workflows/release.yml
```

The `submit-firefox` job builds `dist-firefox/` and runs `web-ext sign --channel=listed` to submit
the new version to AMO (gated on the `AMO_*` secrets, like the Chrome step is on `CWS_*`). The first
run creates the add-on from `gecko.id`; later runs add a version. AMO's human review gates going live.

### First listing (one-time, in the dashboard)

The very first version is uploaded **by hand** (AMO → Submit a New Add-on → Upload Version); CI takes
over for later versions. Build the package to upload:

```sh
pnpm build:firefox && pnpm zip:firefox   # → pipes-firefox.zip (AMO accepts .zip)
```

The **listing details + screenshots** are then set once in the AMO Developer Hub, not by CI:

- Reuse the framed **store screenshots** in `store-screenshots/framed/` and the 128px icon. No
  Firefox-specific capture (the framing pipeline is browser-agnostic). See [`screenshots.md`](screenshots.md).
- All listing fields (name, summary, description, categories, license, reviewer notes) live in
  [`addons-mozilla.md`](addons-mozilla.md).

### AMO review notes

- **Listed** add-ons get a human review (can take days). Because the upload is a built bundle, attach
  the **source + build instructions** (Node/pnpm versions from `.nvmrc`/`package.json`, `pnpm install`
  then `pnpm build:firefox`) so a reviewer can reproduce it.
