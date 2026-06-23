# Releasing to Firefox (addons.mozilla.org)

Pipes ships from **one codebase** to two stores. This is the Firefox / AMO side; the Chrome side is
[`releasing-to-chrome-web-store.md`](releasing-to-chrome-web-store.md). The build target is selected
by the `TARGET` env var, so the same source produces a Chrome bundle (`dist-chrome/`) and a Firefox
bundle (`dist-firefox/`).

Scope: **desktop Firefox 121+**. Add-on id `pipes@feedmypixel.com` (set in the manifest via
`browser_specific_settings.gecko`).

## One-time setup

1. **Create a Firefox Add-on developer account** at <https://addons.mozilla.org> — sign in with a
   Firefox account and register as a developer. **Free** (unlike Chrome's one-off $5).
2. **Generate API credentials** for signing/uploading: AMO → **Tools → Manage API Keys → Generate new
   credentials**. Copy the **JWT issuer** and **JWT secret**.
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

`web-ext run` opens a temporary Firefox profile with Pipes installed — use it to click through the
popup, the **sidebar** (Firefox's equivalent of the Chrome side panel), and the options page, and to
confirm the badge + a notification fire. The dashboard lives in the **sidebar** on Firefox
(`sidebar_action`), not a side panel.

Known Firefox differences (by design):

- Notifications are **leaner** — no sticky/`requireInteraction`, no action buttons. The toast + the
  red badge count still fire; the badge is the durable failure signal.
- The persistent dashboard is the **sidebar**, opened from Firefox's sidebar button (and the popup's
  open-dashboard button once the platform helper lands).

## Release

Cutting a version is the same single step as today (`pnpm release` → tag → push); the tag's CI
draft-uploads to **both** stores.

```sh
pnpm release                       # bumps version, writes CHANGELOG, tags vX.Y.Z
git push --follow-tags origin main # the tag fires .github/workflows/release.yml
```

The Firefox job builds `dist-firefox/`, zips it (`pipes-firefox.zip`), and **draft-uploads to AMO**
via `web-ext sign` (gated on the `AMO_*` secrets, like the Chrome step is on `CWS_*`). You publish
from the AMO dashboard — CI automates the upload, not the going-live.

> The automated AMO upload job is **task 4.0** of the Firefox port — wired once the `AMO_*` secrets
> exist. Until then, build + `web-ext sign` (or upload `pipes-firefox.zip`) by hand.

### AMO review notes

- **Listed** add-ons get a human review. Because the upload is a built bundle, the submission must
  include the **source + build instructions** (Node/pnpm versions from `.nvmrc`/`package.json`,
  `pnpm install` then `pnpm build:firefox`) so a reviewer can reproduce it. Review can take days.
- The listing **reuses the existing assets** — the framed store screenshots in
  `store-screenshots/framed/` and the 128px icon; no Firefox-specific capture is needed (the framing
  pipeline is browser-agnostic). See [`screenshots.md`](screenshots.md).
- Listing copy (name, summary, description, permission justifications) mirrors the Chrome listing in
  [`chromewebstore.md`](chromewebstore.md).
