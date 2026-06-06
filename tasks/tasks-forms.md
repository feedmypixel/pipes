# Tasks: Forms + notifications

From `tasks/prd-forms.md`. Brings the options forms up to standard (validation, errors,
feedback) + an undo-on-delete pattern. Build to `design/v2` (incoming, `design/BRIEF-v2.md`).

## Tasks

- [x] 0.0 Create feature branch (after design v2 lands)
- [x] 1.0 Form primitives (`src/lib/components/forms/`) — `Field`, `Input`, `PasswordInput`, `FormSummary` with the fixed order + ARIA contract
- [x] 2.0 Validation triggers (blur / input / submit) + client rules (host, token); rewire the add-connection form onto the primitives
- [x] 3.0 Notifications — notify store + `Toast` host (success/error/info) + inline banner
- [x] 4.0 Undo-on-delete for connection removal (~5s undo toast)
- [x] 5.0 Stricter dev-chrome mock + wire action feedback across options (added / removed / saved / validate)
- [x] 6.0 Component tests (`vitest-browser-svelte` two-project setup) — Field / Input / PasswordInput / FormSummary + the `toasts` store; Pipes forms docs (`docs/forms.md`, linked from README + styles README)
