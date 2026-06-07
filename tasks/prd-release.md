# PRD: Release (Chrome Web Store) — STUB

Not started — for **after** the hardening PRD. Capturing scope so nothing's lost. The hardening
PRD unblocks this (CI build check, security, store-readiness); this PRD ships it.

## Scope

### Versioning

- Adopt **conventional-commits → automated version bump + changelog + tag**. Candidate:
  `commit-and-tag-version` (successor to `standard-version`) — bumps the version, writes
  `CHANGELOG.md`, commits, tags. Alternative: Changesets.
- **Single source of version truth**: `package.json` ↔ the MV3 manifest (`manifest.config.ts`
  reads `package.json` version, or the tool updates both — they must not drift).
- Tag format `vX.Y.Z`; the release Action triggers on the tag.

### Web Store submission

- **First submission is manual**: create the listing, register on the Chrome Web Store
  developer dashboard ($5 one-off), upload the first zip, fill store fields.
- **Listing assets**: icon set (have), screenshots (popup / side panel / options, light + dark),
  short + full description, category, **privacy policy URL**.
- **Privacy policy** (required): tokens are user-provided, read-only, stored in
  `chrome.storage.local`, never synced, never sent anywhere except the user's chosen GitHub/
  GitLab hosts; no backend; no analytics.
- **Permissions justification** for review: the `optional_host_permissions: ['https://*/*']`
  wildcard (self-hosted origins unknown at build time, requested on a user gesture) — explain it.

### Release automation (GitHub Action)

- On a `v*` tag: `pnpm build` → zip `dist/` → **upload to the Web Store** via
  `chrome-webstore-upload-cli` (or the `PlasmoHQ/bpp` action). Optionally auto-publish vs leave
  in draft for manual review.
- Secrets: CWS API `client_id` / `client_secret` / `refresh_token` as repo secrets (never
  committed). Document the one-time OAuth setup.
- Consider a `package`/`zip` step + attaching the artifact to a GitHub Release too.

## Open questions

- Auto-publish on tag, or upload-as-draft + manual "publish" (safer for review)?
- `commit-and-tag-version` vs Changesets?
- Blog post / launch announcement — part of this or separate.

## Non-goals (here)

- The code hardening itself (separate `prd-hardening`).
