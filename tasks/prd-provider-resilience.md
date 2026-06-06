# PRD: Provider resilience (ETags, rate-limit, timeouts)

## Introduction / Overview

The poll loop makes one request per watched repo per cycle. The background alarm (>=0.5 min)
is fine, but the side panel's planned **active poll (~10s)** would blow GitHub's **5000 req/hr**
limit past ~12 repos. This hardens the provider request layer so frequent polling is safe and
robust: **conditional requests** (ETag/304, free on GitHub), **rate-limit awareness +
back-off**, **timeouts**, and **graceful per-repo failure**. Prerequisite for the side panel;
also makes the existing background poll more robust.

Touches `src/providers/github.ts`, `gitlab.ts`, `poll.ts`, `storage.ts`. No UI.

## Goals

1. **Conditional requests** on the poll hot path — unchanged repos cost no rate-limit budget.
2. **Never trip the rate limit** — read remaining/reset, respect 429 `Retry-After`, back off.
3. **Timeouts** — no hung fetch wedges the cycle.
4. **Graceful failure** — one repo failing keeps its last snapshot; the cycle continues.

## Functional Requirements

1. **Timeouts** — every provider `fetch` uses an `AbortController` with a ~10s timeout; a
   timeout is a normal failure (keep last snapshot), not a crash.

2. **Conditional requests (ETag)** on the per-repo status calls (GitHub `/actions/runs`,
   GitLab `/pipelines`):
   - Persist an ETag per repo (`repoEtags: Record<repoId, string>` in storage).
   - Send `If-None-Match` with the stored ETag.
   - On **304 Not Modified**: keep the repo's existing snapshot, no diff/notify. (GitHub: 304s
     don't count against the rate limit.)
   - On 200: update snapshot + store the new ETag.

3. **Rate-limit back-off** —
   - Read `X-RateLimit-Remaining` / `-Reset` (GitHub), `RateLimit-Remaining` / `-Reset`
     (GitLab) from responses.
   - On **429**: respect `Retry-After`; skip remaining requests this cycle.
   - When remaining is near zero: stop issuing requests until reset (skip the cycle), surface
     quietly (no error spam).

4. **Graceful per-repo failure** — `pollRepo` already isolates per repo; ensure a thrown
   request (network / timeout / non-304 error) leaves the prior snapshot intact and doesn't
   abort sibling repos.

5. **Centralise** the request concerns (timeout, conditional headers, rate-limit parsing) in
   each provider's `request` path rather than scattering — one place per provider.

## Non-Goals

- Caching `/user` or `/repos` (list/validate) with ETags — low frequency, not worth it.
- A user-facing rate-limit UI (a quiet back-off is enough for v1; revisit with the side panel).
- Cross-provider unified rate-limit accounting.

## Technical Considerations

- **ETag store**: SW is ephemeral, so ETags persist in `chrome.storage` (`repoEtags`). The
  "body cache" for 304 is the existing `snapshots` — on 304 we simply don't touch that repo's
  snapshot, so no large body caching needed.
- `request<T>()` returns data today; the poll path needs `{ data, etag } | notModified`. Add a
  conditional variant (e.g. `requestConditional`) used only by the runs/pipelines calls; keep
  the plain `request` for validate/list.
- Back-off state (remaining/reset) can live in module scope within a single `poll()` run (one
  cycle), plus a persisted "paused until reset" timestamp so a restarted SW honours it.
- Pure helpers (parse rate-limit headers, decide-skip) are unit-tested; provider request
  wiring verified against the dev-chrome mock + loaded-unpacked with a real token.

## Success Metrics

- A 10s poll of mostly-idle repos issues almost all 304s (near-zero rate-limit cost), backs off
  cleanly near the limit / on 429, times out hung requests, and never drops a repo's last-known
  status on a transient error. `pnpm check`/`lint`/`test` green; pure helpers tested.

## Open Questions

1. Back-off threshold — pause when remaining < N (e.g. 50) or < a % of limit? (Lean: a small
   absolute floor like 50.)
2. Store last-known rate-limit/reset for display later (side panel), or keep internal for now?
   (Lean: internal now; surface with the side panel if useful.)
