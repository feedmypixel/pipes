# Releasing Pipes to the Chrome Web Store

MV3 package + publish. To dogfood first, see [Testers](#testers).

## Setup (one-time)

- Register a Chrome Web Store developer account ($5): <https://chrome.google.com/webstore/devconsole>
- Host a privacy-policy page (required — Pipes stores a token). A static / GitHub Pages page is fine.

## Build + package

1. `nvm use && pnpm install`
2. Bump `version` in `package.json` (the manifest tracks it; CWS needs each upload higher).
3. `pnpm check && pnpm lint && pnpm test && pnpm security-audit && pnpm build`
4. Load `dist/` unpacked and exercise every surface (incl. a real notification).
5. Zip the **contents** of `dist/` (root must hold `manifest.json`):
   ```sh
   cd dist && zip -r ../pipes-$(node -p "require('../package.json').version").zip . && cd ..
   ```

## Listing assets

Name, short description (≤132 chars), detailed description, 128px icon (`icons/icon-128.png`),
1–5 screenshots at 1280×800 (side panel / popup / options), category Developer Tools.

## Permissions + data (the review-sensitive bit)

Justify each permission in the console:

- `storage` — accounts, token, settings, snapshots (local)
- `alarms` — background polling
- `notifications` — failure / recovery alerts
- `sidePanel` — the side panel
- host `api.github.com` + `gitlab.com` — provider APIs
- optional host `https://*/*` — self-hosted origins, **requested at runtime only** (flag this; a
  broad optional host draws review scrutiny)

**Data use:** read-only token in `chrome.storage.local`, sent only to the user's Git host, no
backend / analytics, not sold or shared. Tick limited-use — this is why the privacy-policy URL is
required.

## Submit

Dev console → New item → upload zip → fill listing + privacy URL + justifications → submit.
Review takes hours to a few days.

## Testers

Dogfood before a public launch:

- **Unlisted** — link-only, still reviewed.
- **Private + trusted testers** — add tester Google accounts under the item's Privacy tab.
- Or keep loading `dist/` unpacked (no store round-trip) — how we've tested so far.

## Updates

Bump version → rebuild → re-zip → upload → resubmit.

## Checklist

- [ ] `version` bumped (higher than published)
- [ ] gate green + functional pass on `dist/`
- [ ] screenshots
- [ ] privacy-policy URL
- [ ] permission justifications + data disclosure
- [ ] zip root has `manifest.json`

See [`tasks/prd-release.md`](../tasks/prd-release.md).
