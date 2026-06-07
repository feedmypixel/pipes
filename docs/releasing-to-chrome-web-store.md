# Releasing Pipes to the Chrome Web Store

The current process to package and publish Pipes (MV3) to the Chrome Web Store (CWS).
For dogfooding first, jump to [Private / unlisted for testers](#private--unlisted-for-testers).

## Contents

- [One-time setup](#one-time-setup)
- [Version + build](#version--build)
- [Package the zip](#package-the-zip)
- [Listing assets to prepare](#listing-assets-to-prepare)
- [Permissions + data disclosure](#permissions--data-disclosure)
- [Submit for review](#submit-for-review)
- [Private / unlisted for testers](#private--unlisted-for-testers)
- [Updates](#updates)
- [Pre-submission checklist](#pre-submission-checklist)

## One-time setup

- A Google account, registered as a **Chrome Web Store developer**
  (<https://chrome.google.com/webstore/devconsole>) — one-time **$5** registration fee.
- A **privacy policy URL** (required — Pipes handles a user token; see disclosure below). A
  short static page is enough; a GitHub Pages page works.

## Version + build

1. `nvm use` then `pnpm install`.
2. Bump the version in `package.json` (`manifest.config.ts` reads it, so the manifest version
   tracks it). CWS rejects an upload whose version is not higher than the published one.
3. Run the gate, then a functional pass:
   ```sh
   pnpm check && pnpm lint && pnpm test && pnpm security-audit
   pnpm build            # → dist/
   ```
   Load `dist/` unpacked and exercise every surface (popup, side panel, options, a real
   notification) before packaging.

## Package the zip

CWS wants a zip whose **root contains `manifest.json`** — zip the contents of `dist/`, not the
folder:

```sh
cd dist && zip -r ../pipes-$(node -p "require('../package.json').version").zip . && cd ..
```

## Listing assets to prepare

- **Name** + **short description** (≤132 chars) + **detailed description**.
- **Store icon** 128×128 — already have `icons/icon-128.png`.
- **Screenshots** 1280×800 (or 640×400), 1–5. Capture the side panel (with a failing repo), the
  popup, and the options/connection screen.
- **Small promo tile** 440×280 (optional, recommended).
- **Category**: Developer Tools. **Language**: English.

## Permissions + data disclosure

The review hinges on this — justify each permission in the console's permission-justification
fields:

| Permission                                          | Why                                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                           | Save accounts, the read-only token, settings + cached pipeline snapshots locally.                                                                                                                 |
| `alarms`                                            | Schedule background polling (the worker is ephemeral).                                                                                                                                            |
| `notifications`                                     | Alert on a default-branch / PR failure + recovery.                                                                                                                                                |
| `sidePanel`                                         | The persistent side-panel surface.                                                                                                                                                                |
| `host_permissions` (`api.github.com`, `gitlab.com`) | Call the provider APIs for pipeline status.                                                                                                                                                       |
| `optional_host_permissions` (`https://*/*`)         | Self-hosted GitHub Enterprise / GitLab origins, requested at runtime on a user gesture — **not** used until then. Call this out explicitly; a broad optional host can draw extra review scrutiny. |

**Data use:** declare that Pipes stores a **user-provided read-only token** in
`chrome.storage.local`, transmits it **only** to the user's chosen Git host, has **no backend, no
analytics, no remote server**, and **does not sell or share** data. Tick the "limited use"
compliance boxes. This is why the privacy policy URL is required.

## Submit for review

1. Dev console → **New item** → upload the zip.
2. Fill the listing, privacy policy URL, data-use disclosures, and permission justifications.
3. **Submit for review.** Review typically takes hours to a few days; the broad
   `optional_host_permissions` may lengthen it — the runtime-request justification helps.

## Private / unlisted for testers

To dogfood before a public launch, avoid the full public review wait:

- **Unlisted** — published but link-only (not searchable). Still reviewed, but usable by anyone
  with the link.
- **Private + trusted testers** — under the item's **Privacy** tab, add tester Google accounts;
  only they can install. Best for a small dogfooding group.

(Or keep loading `dist/` unpacked locally — no store round-trip at all — which is how we've been
testing.)

## Updates

Bump `package.json` version → rebuild → re-zip → upload the new version → resubmit. Same review.

## Pre-submission checklist

- [ ] `package.json` version bumped (higher than published)
- [ ] gate green (`check` / `lint` / `test` / `security-audit`) + `pnpm build`
- [ ] functional pass on the unpacked `dist/` (all surfaces + a live notification)
- [ ] screenshots captured (side panel / popup / options)
- [ ] privacy policy hosted, URL ready
- [ ] permission justifications + data-use disclosure written
- [ ] zip built from inside `dist/` (root has `manifest.json`)

See also [`tasks/prd-release.md`](../tasks/prd-release.md) for the release/versioning plan.
