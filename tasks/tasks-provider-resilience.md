# Tasks: Provider resilience

From `tasks/prd-provider-resilience.md`. Hardens the provider request layer so frequent polling
(the side panel's ~10s active poll) is safe: ETags, rate-limit back-off, timeouts, graceful
failure. Prerequisite for the side panel.

## Parent tasks

- [ ] 0.0 Create feature branch
- [ ] 1.0 Timeouts — `AbortController` (~10s) on every provider fetch; a timeout is a graceful
      failure (keep last snapshot), not a crash
- [ ] 2.0 Rate-limit parsing + back-off — read remaining/reset (GitHub `X-RateLimit-*`, GitLab
      `RateLimit-*`), honour 429 `Retry-After`, persist a "paused until reset" timestamp; pure
      header-parse + skip-decision helpers, unit-tested
- [ ] 3.0 Conditional requests (ETag) on the runs/pipelines calls — `repoEtags` storage key;
      send `If-None-Match`; 304 → keep snapshot (no diff/notify); 200 → update + store ETag
- [ ] 4.0 Graceful per-repo failure — a thrown/timed-out request leaves the prior snapshot
      intact and never aborts sibling repos in the cycle
- [ ] 5.0 Tests (rate-limit parse, skip decision, 304 path) + dev-chrome mock supports
      ETag/304; verify loaded-unpacked with a real token
