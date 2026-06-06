# Hardening backlog

Deferred items to fold into the hardening PRD (not started; #1 priority is building the
product). Captured so nothing is lost.

## Tooling / CI

- **stylelint** — add `stylelint` + `stylelint-config-standard` + `stylelint-config-html` +
  `postcss-html`; `.stylelintrc.json` with `color-no-hex` (hex only in `tokens.css`); fold
  into `lint`. Our CSS already passes. "At some point" per Ben.
- **Dependabot** — `.github/dependabot.yml`, schedule **weekly on Wednesday**, for npm
  (pnpm) deps + GitHub Actions versions. **Ignore `vite` and `@sveltejs/vite-plugin-svelte`
  major bumps** — held at 6 / 5 on purpose for crxjs dev stability (bumping to 8 / 7
  re-breaks the dev server).
- **Secret detection** — gitleaks Action + a husky pre-commit hook (GitLab `Secret-Detection`
  equivalent). TruffleHog is the alternative.
- **SAST** — Semgrep (`semgrep ci`), free on private repos (GitLab `SAST` equivalent).
  `eslint-plugin-security` is **already in the repo** (lightweight SAST; currently 8
  known-safe `object-injection` warnings on typed `keyof` access + self-generated ids).
- Note: GitHub **native** secret scanning / push protection / CodeQL need **paid** Advanced
  Security on private repos, so we use the Action-based tools above. Tokens are user-provided
  at runtime (never committed), so this mainly guards accidental credential commits.
- **Dependency freshness** — keep deps current (see `pnpm outdated`); Dependabot automates
  the ongoing bumps.

## Tests

- **Coverage threshold** — vitest coverage, **>= 80%** (be lenient while building; ratchet
  up later). Add the `@vitest/coverage-v8` config + the threshold gate.
- **Component tests** — `vitest-browser-svelte` with `chrome.*` mocked, landing with each
  surface PRD.
- **E2E** — thin Playwright smoke layer (load built `dist/` via `--load-extension`,
  route-mock the provider APIs, never real tokens). Arrives with the first surface.
- **Visual regression** — automate the screenshot pass currently done by hand (popup / options /
  showcase, light + dark). Playwright `toHaveScreenshot` baselines, driven via the showcase +
  the dev-chrome shim (or `--load-extension`); forces the theme with `data-theme`. Catches the
  unintended-shift class of bug (e.g. the CSS-arch snaps) that unit tests can't. Pin to the
  `browser` vitest project's Chromium so CI has one browser. Gate at a tolerance, not pixel-exact.

## Layout

- **`Stack` layout primitive (vertical rhythm)** — TBD. Rhythm is currently delivered by
  scattered per-component outer margins (`.field` margin-bottom, Banner/FormSummary
  margin-bottom, `.card` margin-top, `.button-group` margin-top). Consolidate into one
  gap-owned flow container (a `Stack` component or a `.stack` object) so children carry no
  outer margins — the "a repeated layout primitive earns an objects layer" trigger from
  `docs/css.md`. Migrate options + forms onto it. (Spacing is already rhythm-correct via the
  `--space-*` tokens; this is the consolidation, not a correctness fix.) No 2D grid needed —
  surfaces are 1D stacks.

## Code structure (from the earlier hardening discussion)

- **Central config** (`src/lib/config.ts`) — pull the scattered constants (page sizes,
  alarm name, intervals, badge colour, notif id prefixes, SaaS hosts) into one module.
- **Zod** at boundaries — schemas for `Account`/`Repo`/`Pipeline`/`Settings`/`Snapshots`;
  validate `chrome.storage` reads (replace the `as` casts) and optionally API responses.
- **Logger** — **pino** (`pino/browser`), level-gated, never logs tokens.
- **Resilience** — provider `request()`: handle 429 / rate-limit + fetch timeouts.
- **Notification icon** — use the greyscale logo on notifications (not the green tick).
- **Prod `web_accessible_resources`** — verify crxjs output isn't over-broad (`<all_urls>`).

## Features (post-build, nice-to-have)

- **Token-expiry warning banner** — a third inline-banner variant (amber, neither error nor
  success) warning "token expires soon" on a connection. Design's inline banner is `ok`/`err`
  only by intent; this adds a `warn` variant + token + wires the `warning` MessageIcon glyph
  (already exists). Needs: read the PAT expiry (GitHub exposes it via the
  `github-authentication-token-expiration` response header; GitLab `/personal_access_tokens`
  has `expires_at`), threshold, and the banner on the connection row. Own follow-up PRD/task
  after the core surfaces are built.
