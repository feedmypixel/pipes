# Tasks: No pipelines on a PR

From `prd-no-pipelines-on-pr.md`. Design contract: `design/v7/NO-PIPELINES.md`.

## Relevant Files

- `src/providers/types.ts` - `Change.status: PipelineStatus | null`.
- `src/background/poll.ts` - `null` fallback; `decideAction` silent on `null`; runs refetch for a new PR on a 304.
- `src/lib/storage.ts` - `SCHEMA_VERSION` bump.
- `src/lib/group.ts` - shared "every chip on" predicate; `null` PRs in `visibleChanges`.
- `src/lib/components/status-icon.ts` - `statusVisual(null)`.
- `src/lib/components/StatusIcon.svelte` - hollow ring.
- `src/lib/components/ChangeRow.svelte` - `data-status="none"`.
- `src/showcase/Showcase.svelte` - `null` row.

### Notes

- Tests sit next to source (`*.test.ts` node, `*.svelte.test.ts` browser). Use `test`.
- Gate: `pnpm check && pnpm lint && pnpm test`, build to a scratch `--outDir`, then
  `pnpm security-audit`.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git switch -c feat/no-pipelines-on-pr` off an up-to-date `main`
- [x] 1.0 Model
  - [x] 1.1 Failing tests: a PR with no run polls to `null`; `decideAction` silent for `null` prev/next
  - [x] 1.2 `Change.status` nullable; `poll.ts` fallback `null`; `decideAction` handles `null`
  - [x] 1.3 `SCHEMA_VERSION` 13 → 14
- [x] 2.0 Filtering
  - [x] 2.1 Failing tests: `null` PR visible only with every chip on; not in `failingCount`
  - [x] 2.2 Shared predicate in `group.ts`, used by `visibleChanges` + `noPipelinesVisible`
- [x] 3.0 UI
  - [x] 3.1 Failing tests: `statusVisual(null)`; StatusIcon ring (no glyph, label); ChangeRow `data-status`, label, no time
  - [x] 3.2 `status-icon.ts`, `StatusIcon.svelte`, `ChangeRow.svelte`
  - [x] 3.3 Showcase `null` row
- [x] 4.0 Verify
  - [x] 4.1 Gate
  - [x] 4.2 Measure mock vs showcase (ring box + stroke, row strip, meta-end) in light + dark
  - [x] 4.3 Independent review
  - [x] 4.4 Review fix: a new PR on a runs 304 refetches runs (failing test first)
