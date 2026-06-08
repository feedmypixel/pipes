# Releasing Pipes to the Chrome Web Store

MV3 package + publish. To dogfood first, see [Testers](#testers).

- [Setup (one-time)](#setup-one-time)
- [Build + package](#build--package)
- [Listing assets](#listing-assets)
- [Permissions + data](#permissions--data-the-review-sensitive-bit)
- [Submit](#submit)
- [Testers](#testers)
- [Updates](#updates)
- [CI (intended)](#ci-intended)
- [Feedback + licensing](#feedback--licensing)
- [Checklist](#checklist)

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

## CI (intended)

Not built yet — the release is hand-driven today. Two stages, added in order of risk.

**Stage 1 — versioning (local, low-risk).** On merge to `main`:

1. **Bump version** — [`commit-and-tag-version`](https://github.com/absolute-version/commit-and-tag-version)
   reads the conventional commits and picks the next semver (`fix:` → patch, `feat:` →
   minor, `feat!:` → major). The manifest tracks `package.json`, so this is the release version.
2. **Changelog + tag** — the same step writes `CHANGELOG.md` and tags `vX.Y.Z` (handy as the
   CWS "what's new" text).

**Stage 2 — package + upload (holds credentials, add deliberately).** Once Stage 1 is proven, a
GitHub Action builds `dist/`, zips it, and pushes to the store via
[`chrome-webstore-upload-cli`](https://github.com/fregante/chrome-webstore-upload-cli) (the CWS
API; needs an OAuth client + refresh token in repo secrets). Review still gates publication, so
this automates the upload, not the going-live.

## Feedback + licensing

How users report bugs, and what going public does (or doesn't) protect.

**Bug/feedback channel.** Chrome doesn't require an in-app contact; the Web Store listing's
**Support** tab takes an email _or_ a URL (a URL is enough — no inbox spam). To keep bugs
structured without exposing the code, the plan is a **separate public `pipes-feedback` repo**
(README + issue templates, no source); the in-app bug icon and the CWS Support tab both point
there. `pipes` stays private. Alternatives if ever wanted: a hosted board (Canny/Tally) or a
filtered email alias.

**Licensing if the code goes public.** Note first: an extension's JS already ships readable
(anyone can unpack the `.crx`), and a licence governs legal _reuse_, not access. So publishing
source reveals little more than shipping does — the moat is the listing, polish, and upkeep, not
the code. Pick deliberately:

- **MIT** (current) — maximal permissive: anyone may copy, modify, **and sell**. Great for
  adoption, zero protection against being lifted.
- **AGPL-3.0 / GPL-3.0** — copyleft: forks/redistribution must stay open-source. Deters closed
  commercial copies.
- **Source-available (e.g. BSL)** — viewable, but no redistribution/commercial use. Protective,
  but not OSI "open source" (some won't contribute).

Current stance: keep `pipes` **private**, use the separate public feedback repo for Issues, and
revisit the licence only if/when the code is made public. (Not legal advice.)

## Checklist

- [ ] `version` bumped (higher than published)
- [ ] gate green + functional pass on `dist/`
- [ ] screenshots
- [ ] privacy-policy URL
- [ ] permission justifications + data disclosure
- [ ] zip root has `manifest.json`

See [`tasks/prd-release.md`](../tasks/prd-release.md).
