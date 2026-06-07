# Tasks: Hardening

From `tasks/prd-hardening.md` + `tasks/review-2026-06-07.md`. Phased; **P1 is the go-live gate.**
Each parent task is its own small PR. Check off sub-tasks as completed.

## Relevant files

- `src/lib/async.ts` — bounded-concurrency `mapLimit` helper (new).
- `src/providers/http.ts` — 429/rate-limit detection + typed error.
- `src/background/poll.ts` — single-flight, bounded fan-out, rate-limit pause, auth short-circuit.
- `src/lib/components/TopAlerts.svelte` — surface rate-limited connections.
- `src/popup/App.svelte` / `src/sidepanel/App.svelte` — derive + pass rate-limit state.
- `src/lib/config.ts` — central constants (new).
- `*.test.ts` alongside each.

## Parent tasks

### P1 — release-critical

- [x] 1.0 **Poll resilience**
  - [x] 1.1 `mapLimit(items, limit, fn)` helper + test (bounded concurrency).
  - [x] 1.2 Single-flight `poll()` — module-scoped in-flight promise; concurrent calls coalesce.
  - [x] 1.3 Replace the unbounded `Promise.all` fan-out with `mapLimit` (limit 6).
  - [x] 1.4 `http.ts`: detect 429 (+403 secondary) → throw a typed `RateLimitError` carrying the
        reset epoch (parse `Retry-After` / `x-ratelimit-reset`).
  - [x] 1.5 `poll`/`pollRepo`: catch `RateLimitError` → set `rateLimitPausedUntil[account.id]`;
        same for the `validateToken` health check.
  - [x] 1.6 Skip polling repos whose account health is already known-bad this cycle (avoid N 401s).
  - [x] 1.7 Surface rate-limit state — derive rate-limited accounts in the surfaces; `TopAlerts`
        shows a distinct "‹label› rate limited — resumes in ~Nm" banner (+ showcase example).
  - [x] 1.8 Tests: `mapLimit`, 429 → `RateLimitError`. (single-flight + full `poll()` coverage
        lands with 3.0's `poll()` orchestration test.)

- [x] 2.0 **Branch-centric data model**
  - [x] 2.1 Provider `listBranches(account, repo, etag)` (GitHub `/branches`, GitLab
        `/repository/branches`), ETag-conditional.
  - [x] 2.2 Cache branches + ETag per repo (`branchCache` storage key).
  - [x] 2.3 Intersect latest-run-per-ref with live branches (default always kept); drop ghosts.
  - [x] 2.4 GitHub: dedupe newest run per ref by max `updated_at`, not list order.
  - [x] 2.5 MR-pipeline refs + tag refs drop out naturally (not in `/branches`); no-run branches
        are simply not shown (we filter runs, not list branches). Default always kept.
  - [x] 2.6 `keepLiveBranches` test. (Provider `listBranches` mapping covered with 3.0.)

- [ ] 3.0 **Core test suite + CI signal**
  - [ ] 3.1 `poll()` orchestration test. 3.2 `notify` test. 3.3 provider mapping tests.
  - [ ] 3.4 Component tests (RepoCard/RepoList/TopAlerts/UpdatedFooter/Row).
  - [ ] 3.5 CI: coverage report (non-gating) + `pnpm build` job + Playwright-install parity.

- [x] 4.0 **Central config** (`src/lib/config.ts`)
  - [x] 4.1 SaaS hosts (`SAAS_HOST`). 4.2 alarm floor `MIN_POLL_MINUTES` (worker ↔ options) +
        `POLL_ALARM`. 4.3 `BADGE_FAIL_COLOR`, `NOTIF_PREFIX`. 4.4 consumers updated. (Provider
        page sizes left in their adapters — provider-specific, not cross-cutting.)

### P2 — quality + safety

- [ ] 5.0 **Boundaries + logger + dedup** — deepen `matchesShape` (or zod); level-gated logger
      (pino vs wrapper); `createDashboardState()` rune module.
- [ ] 6.0 **a11y + tooling + dev boundary** — disabled-button fixes + focus/aria; Dependabot +
      gitleaks + Semgrep + stylelint + dep bump; `src/dev/` boundary + prod guard + eslint rule.

### P3 — nice-to-have

- [ ] 7.0 **Notification enrichment** — emoji→brand icon, contextMessage, Open-run button,
      reliable recovery; token-expiry banner.
- [ ] 8.0 **Polish** — Stack + shared chrome; visual regression; coverage gate.
