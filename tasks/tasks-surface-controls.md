# Tasks: Surface controls

From `tasks/prd-surface-controls.md`. Segmented sort + status filter on the surfaces; drop the
per-repo collapse. Repos + main always show; the filter governs branch rows.

## Parent tasks

- [x] 0.0 Create feature branch
- [x] 1.0 `group.ts` — `visibleBranches(view, allowedStates)` helper (merges active+collapsed,
      filters by state); unit-tested. Keep main/primary out of the filter.
- [x] 2.0 Side panel — segmented `[ Name | Status ]` sort + per-state filter chips; drop the
      collapse / `expanded`; persist sort + allowed states in localStorage
- [x] 3.0 Popup — "problems only" toggle (failed/running/pending branches); drop the collapse;
      persist; keep it lean (no sort control)
- [x] 4.0 Verify — filter/sort helpers tested; popup + side panel screenshotted, light + dark
