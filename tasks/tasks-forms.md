# Tasks: Forms + notifications

From `tasks/prd-forms.md`. Brings the options forms up to standard (validation, errors,
feedback) + an undo-on-delete pattern. Build to `design/v2` (incoming, `design/BRIEF-v2.md`).

## Tasks

- [ ] 0.0 Create feature branch (after design v2 lands)
- [ ] 1.0 Form primitives (`src/lib/components/forms/`) — `Field`, `Input`, `PasswordInput`, `FormSummary` with the fixed order + ARIA contract
- [ ] 2.0 Validation triggers (blur / input / submit) + client rules (host, token); rewire the add-connection form onto the primitives
- [ ] 3.0 Notifications — notify store + `Toast` host (success/error/info) + inline banner
- [ ] 4.0 Undo-on-delete for connection removal (~5s undo toast)
- [ ] 5.0 Stricter dev-chrome mock + wire action feedback across options (added / removed / saved / validate)
- [ ] 6.0 Component tests (`vitest-browser-svelte` setup) + Pipes forms docs (`docs/forms.md`, linked from README) + gates
