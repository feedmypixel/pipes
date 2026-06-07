# Tasks: Hardening

From `tasks/prd-hardening.md` + `tasks/review-2026-06-07.md`. Phased; **P1 is the go-live gate.**
Each parent task is intended to be its own small PR (hardening spans many PRs, not one branch).

> Parent tasks below. Sub-tasks generated on "Go". Start order: 1.0 first (the rate-limit /
> resilience blocker Ben flagged).

## Parent tasks

### P1 — release-critical

- [ ] 1.0 **Poll resilience** — single-flight guard (no overlapping cycles racing on storage);
      bounded fetch concurrency (pool, not unbounded `Promise.all`); detect 429/403-rate-limit +
      parse `Retry-After`/reset → set `rateLimitPausedUntil`; **surface a distinct "Rate limited —
      resumes in ~Nm" state** in the UI; make a dead-token (401) state explicit.
- [ ] 2.0 **Branch-centric data model** — show live branches + latest run; drop merged/deleted
      ghosts via the live-branches API intersection (ETag-conditional, cached per repo); fix the
      GitHub "newest run per ref" ordering (dedupe by max `updated_at`, not list order).
- [ ] 3.0 **Core test suite + CI signal** — tests for `poll()`, `notify`, provider mapping, and
      the shared components; add a non-gating coverage report + a `pnpm build` job to CI; fix the
      pre-push ↔ CI Playwright-install mismatch.
- [ ] 4.0 **Central config** — `src/lib/config.ts` for SaaS hosts, the `0.5` alarm floor (worker
      ↔ options), badge colour, notif id prefixes, page sizes.

### P2 — quality + safety

- [ ] 5.0 **Boundaries + logger + dedup** — deepen `matchesShape` guards (or zod — decide per
      dep-minimalism); a level-gated logger that never logs tokens (pino vs wrapper — decide);
      extract `createDashboardState()` to de-dupe popup/side-panel storage wiring.
- [ ] 6.0 **a11y + tooling + dev boundary** — fix the disabled-button violations + focus/aria
      sweep; Dependabot (weekly Wed, ignore held majors) + gitleaks + Semgrep + stylelint; routine
      safe dep bump; move dev modules to `src/dev/` with a prod-guard + ESLint import rule.

### P3 — nice-to-have (after the above)

- [ ] 7.0 **Notification enrichment** — drop title emoji (keep brand icon), add `contextMessage`,
      an "Open run" button + handler, reliable recovery notifications; later the token-expiry banner.
- [ ] 8.0 **Polish** — `Stack` + shared chrome primitives; Playwright visual-regression
      baselines; ratchet coverage to a hard threshold.

---

Respond **"Go"** to expand these into sub-tasks (starting with 1.0).
