# PRD: Hardening

Take Pipes from "works and is pleasant" to "ready for the Chrome Web Store and robust in real
use." Inputs: `tasks/hardening-backlog.md` (the captured list) + `tasks/review-2026-06-07.md`
(the codebase review). This PRD is phased so release-critical work lands first; nice-to-haves
are explicitly later.

## Goals

1. **Resilient under real API conditions** — no double-polling, no hammering a rate-limited API,
   clear back-off, and rate-limit/auth state surfaced to the user instead of failing silently.
2. **Trustworthy data model** — show _branches that exist_, not ghost runs of deleted branches.
3. **Tested where it matters** — the runtime paths (poll, notify, providers) and the shared
   components, with a coverage signal in CI.
4. **Maintainable** — central config, no scattered constants, dependency-minimal, dev-only code
   clearly bounded, no dead code.
5. **Store-ready** — build verified in CI, security tooling, listing + privacy basics (release
   itself is a separate PRD; this just unblocks it).

## Non-goals

- New product features beyond the branch-model correction (notifications enrichment + token-
  expiry banner are captured but **deferred to after the core hardening**, per Ben).
- The Web Store listing/screenshots/blog (separate `prd-release`).
- Bumping the deliberately-held `vite` / `@sveltejs/vite-plugin-svelte` majors.

## Phasing

### P1 — release-critical (correctness, resilience, core tests)

1. **Poll resilience** — single-flight guard so overlapping cycles (alarm + `poll-now` +
   startup) can't race on `chrome.storage`; bounded fetch concurrency (pool ~5–10) instead of an
   unbounded `Promise.all`; **429/403-rate-limit handling** — detect it in `fetchJson`, parse
   `Retry-After` / `x-ratelimit-reset`, set `rateLimitPausedUntil`, and **surface a distinct
   "Rate limited — resumes in ~Nm" state** (not a generic connection error).
2. **Branch-centric model** — show live branches + their latest run; drop merged/deleted-branch
   ghosts by intersecting latest-run-per-ref with the live-branches API (GitHub `/branches`,
   GitLab `/repository/branches`), ETag-conditional + cached per repo to stay rate-limit-cheap.
   Default branch always kept. (See backlog "Data / freshness" for the confirmed evidence + the
   MR-pipeline sub-decision.)
3. **Core tests** — `poll()` orchestration, `notify` (badge + link round-trip), provider
   response mapping (`listPipelines`/`listRepos`), and the shared components (`RepoCard`,
   `RepoList`, `TopAlerts`, `UpdatedFooter`, `Row`). Add a non-gating coverage report in CI.
4. **Central config** (`src/lib/config.ts`) — the SaaS hosts, the `0.5` alarm floor (duplicated
   in worker + options UI — must stay in sync), badge colour, notif id prefixes, page sizes.
5. **CI build check** — add `pnpm build` to CI (entry points now exist; the stale NOTE's
   precondition is met) and fix the pre-push ↔ CI Playwright-install mismatch.

### P2 — quality + safety

6. **Boundary validation** — extend the `matchesShape` hand guards (the comment over-promises;
   it only checks container type) to the few critical shapes, or adopt zod — **decide against
   the dep-minimalism stance first** (lean: hand guards).
7. **Logger** — level-gated, never logs tokens — **pino vs a ~20-line `console` wrapper; decide
   per dep-minimalism** (lean: wrapper).
8. **Dashboard-state dedup** — extract the duplicated popup/side-panel storage-wiring into a
   `createDashboardState()` rune module.
9. **a11y sweep** — fix the disabled-button rule violations (RepoCard/owner toggles), focus
   order, aria, keyboard reach.
10. **CI / security tooling** — Dependabot (weekly Wed; ignore the held majors), gitleaks,
    Semgrep, stylelint (`color-no-hex`). Routine dep bump of the safe minors.
11. **Dev-only boundary** — move dev modules to `src/dev/`, add a prod-guard throw, ESLint
    `no-restricted-imports`.
12. **Bundle-size check** — confirm lucide is per-icon tree-shaken (the ~55 kB chunk).

### P3 — nice-to-have (after the above)

13. **Notification enrichment** — drop the title emoji (keep the brand iconURL), add
    `contextMessage` (`GitHub Actions · 2m ago`), an "Open run" action button (+ a
    `onButtonClicked` handler), and make **recovery** notifications reliably visible. (Ben's 5
    items; deferred to here.)
14. **Token-expiry warning banner** — amber `warn` banner variant from the PAT expiry header.
15. **Layout primitives** — `Stack` + shared chrome (`IconButton`/`Card`/group-header/empty-
    state/`RefChip` reuse).
16. **Visual regression** — Playwright `toHaveScreenshot` baselines (light/dark).
17. **Coverage gate** — ratchet the report to a hard ~80% threshold.

## Success metrics

- No unhandled rejections in the worker; a forced 429 visibly pauses + shows resume time.
- Deleted branches disappear from the UI within one poll; live branches remain.
- CI runs check + lint + test (+ coverage report) + build; coverage visible.
- Runtime dependencies stay minimal (justify any addition).

## Open questions

- Branch model: omit branches with no runs, or show "no runs"? Drop MR-pipeline refs entirely?
- pino vs wrapper; zod vs hand guards — confirm the dep calls.
- Coverage: report-only now, threshold when?
