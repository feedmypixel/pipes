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

- **Shared surface chrome (DRY + parity)** — TBD. The surface `.svelte` files duplicate
  scoped styles that should live in a shared layer, for DRY + parity across popup / options /
  side panel:
  - `.icon-button` — duplicated in **popup + options** → an `IconButton` component (interactive,
    has hover/focus).
  - `.button-group` — duplicated in **options + showcase** → a `Cluster` / button-group object.
  - `.card` / `.card-body` (options) + the popup app-bar → a `Card` component/pattern the side
    panel will also want.

  Plus **same thing, different names** (semantic duplication to unify):
  - small mono group/section label: `.eyebrow` (showcase) = `.owner-name` (popup) =
    `.repo-group-header` text (options) → one label pattern.
  - group header bar (surface-2 + label + optional action): `.owner` (popup) =
    `.repo-group-header` (options) → one group-header object.
  - empty-state message: `.empty` / `.empty-action` (popup) = `.repo-empty` (options) → one
    empty-state pattern.
  - card/panel: `.card` (options) = `section` (showcase) → `Card`.
  - branch chip: `.repo-branch` (options) reinvents the existing **`RefChip`** component → use
    `RefChip`.

  Categorise each as component (markup + behaviour) vs object (classless layout) vs utility per
  `docs/css.md`; pairs with the `Stack` primitive above. Do before/with the side panel so it
  reuses them rather than re-duplicating.

## Code structure (from the earlier hardening discussion)

- **Central config** (`src/lib/config.ts`) — pull the scattered constants (page sizes,
  alarm name, intervals, badge colour, notif id prefixes, SaaS hosts) into one module.
- **Zod** at boundaries — schemas for `Account`/`Repo`/`Pipeline`/`Settings`/`Snapshots`;
  validate `chrome.storage` reads (replace the `as` casts) and optionally API responses.
- **Logger** — **pino** (`pino/browser`), level-gated, never logs tokens.
- **Resilience** — provider `request()`: handle 429 / rate-limit + fetch timeouts.
- **Notification icon** — use the greyscale logo on notifications (not the green tick).
- **Prod `web_accessible_resources`** — verify crxjs output isn't over-broad (`<all_urls>`).

## Dependencies & dev-only boundaries

- **Dependency minimalism** — runtime deps are currently just `@lucide/svelte` (Svelte compiles
  away; no date/util libs — `RelativeTime` is hand-rolled). Keep it that way: prefer platform
  APIs / small hand-rolled code over deps (supply-chain + npm-security surface). Specifically,
  **reconsider the planned hardening deps**: **pino** → a ~20-line level-gated `console` wrapper
  is enough for a client-only extension; **zod** → extend the existing `matchesShape` hand
  guards rather than add zod. Optional zero-dep stretch: inline the ~18 lucide SVGs to drop the
  last runtime dep (low value vs maintenance — probably keep lucide).
- **Dev-only module boundary** — make "dev only" enforced, not just named (`dev-chrome.ts`,
  `dev-theme.ts`). (1) Co-locate in `src/dev/` (the directory is the signal, like `*.test.ts`).
  (2) Fail loud: `if (import.meta.env.PROD) throw new Error('dev-only module loaded in production')`
  at the top of each — turns a future un-guarded import from a silent prod leak into an obvious
  error (Vite already strips them via the `import.meta.env.DEV` guard). (3) ESLint
  `no-restricted-imports` so only the surface `main.ts` entries may import `src/dev/*`.
- **Bundle-size review** — a `chevron-right-*.js` chunk shipped at ~55 kB (20 kB gzip); likely
  the Svelte-runtime + lucide vendor chunk just named after a module in it, but confirm lucide
  is per-icon tree-shaken and the chunk isn't pulling in more than expected.

## Data / freshness

- **Branch-centric model: show live branches, not raw runs** (headline — likely its own PRD).
  Pipes currently lists pipeline **runs** grouped by `head_branch`. GitHub Actions + GitLab keep
  runs after a branch is merged/deleted, so the UI fills with ghost rows for branches that no
  longer exist — programmatically correct, mentally wrong. Confirmed on `feedmypixel/pipes`:
  live branches = `main` + `feat/popup-failures-showcase-alerts` (2), but run `head_branch`es =
  17 (all the merged/deleted ones).

  **Target model:** show each **branch that still exists** + its **latest run** (pass/fail);
  when a branch is merged + deleted it drops out of the view.

  **Approach:** fetch the repo's live branches (GitHub `GET /repos/{o}/{r}/branches`, GitLab
  `GET /projects/:id/repository/branches`), then intersect the existing latest-run-per-ref with
  that set (default branch always kept). Deleted branches fall out automatically.

  **Rate limit (be mindful):** ~1 extra request per repo per poll. Make it **ETag-conditional**
  so a 304 costs no GitHub budget (GitLab list ETag support is uncertain — verify; lean on the
  rate-limit floor back-off). Cache the branch list + its ETag per repo (new storage key, same
  pattern as `repoEtags`). Page at 100; for huge repos cap + note.

  **Sub-decisions:** (a) GitLab `refs/merge-requests/*/merge` pipelines aren't branches — drop
  from the branch view (revisit MR pipelines as a separate concept later); (b) a branch with no
  runs yet — omit (nothing to report) vs show as "no runs"; (c) keep a recency window as a cheap
  secondary guard? Probably unnecessary once the intersection lands.

## Loose ends captured from build sessions (verify when writing the PRD)

- **Throttle the per-poll `validateToken`** — connection health currently validates every
  account on every poll (1/min). Throttle (e.g. every N polls or on a longer interval / only
  after an auth-looking failure) to spare rate-limit budget.
- **Showcase parity** — add `RepoList`, `TopAlerts`, `UpdatedFooter` to `src/showcase/` and
  refresh the `RepoCard` demo; keep the showcase current with the shared components.
- **a11y sweep** — focus order, `aria-*`, keyboard reach + focus-visible across popup / side
  panel / options; verify the new buttons (owner toggle, repo toggle, clears) announce well.
- **FAQ / Help** — decide placement (Web Store "Support" tab + an in-extension Help link or a
  docs page) and write it. (Release-adjacent.)
- **`ROADMAP.md` refresh** — it's stale: mark phases 1–4 ✅, Phase 5 = hardening, Phase 6 =
  release.
- **Richer notifications (optional)** — `contextMessage` + action buttons + `list` grouping;
  and custom sound via an offscreen doc. Deferred — click-to-job was deemed enough.

## From the bath (2026-06-07)

- **Showcase: TopAlerts variants** — render the side-panel top-message states in the showcase:
  connection issue (amber), default branch failing (red alarm), all passing (green). Lets us
  eyeball all three + both themes without forcing real failures.
- **Popup quick "failures only" toggle** — popup is the glance; add a one-tap toggle to show
  only failing repos so problems jump out instantly. Delve deeper → jump to side panel → dig
  in → repo links. (NB: a Failures view was trialled in the _side panel_ and removed; this is
  the _popup_, as a lightweight glance toggle — confirm interaction before building.)
- **Drop the Name/Status sort (side panel)** — the state pills + search make sort redundant;
  remove the segmented sort control. (Revisit only if a clear need returns.)

## Components / UI

- **Tooltip component** — replace native `title=` (ugly, slow ~1.5s delay, untyped) with a
  small `Tooltip` showing the same values nicely. Used heavily on rows (pipeline title), icon
  buttons, the star/branch marks. Needs hover/focus trigger, positioning that survives the
  narrow popup (portal or anchored), keyboard + `prefers-reduced-motion` aware. Drives off a
  `tooltip` prop/snippet so it's reusable.

## Features (post-build, nice-to-have)

- **Token-expiry warning banner** — a third inline-banner variant (amber, neither error nor
  success) warning "token expires soon" on a connection. Design's inline banner is `ok`/`err`
  only by intent; this adds a `warn` variant + token + wires the `warning` MessageIcon glyph
  (already exists). Needs: read the PAT expiry (GitHub exposes it via the
  `github-authentication-token-expiration` response header; GitLab `/personal_access_tokens`
  has `expires_at`), threshold, and the banner on the connection row. Own follow-up PRD/task
  after the core surfaces are built.
