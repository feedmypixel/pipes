# Tasks: Popup surface

From `tasks/prd-popup.md`. The glance surface (380px toolbar dropdown) composing the
foundation primitives, live from `chrome.storage`. Design: `design/v1/` (popup section,
`screenshots/01-popup.png`).

## Tasks

- [x] 0.0 Create feature branch (`feature/popup`)
- [ ] 1.0 Pure grouping/sort module + tests (snapshots + watchedRepos → owner groups, A–Z, default-branch primary + collapsible others)
- [ ] 2.0 Popup shell — 380px frame, dark app-bar header (green-tick logo + "Pipes" wordmark + refresh / panel-right / settings buttons), footer (live indicator + "updated")
- [ ] 3.0 Body — owner groups (mono owner + count chip) + `Row` reuse + "Show N other branches" toggle
- [ ] 4.0 Alarm strip (N failing on main + jump) + states (unconfigured CTA → options, healthy "all clear")
- [ ] 5.0 Wire to storage (live `snapshots` subscribe), header actions (poll-now / sidePanel.open / openOptionsPage); verify with seeded storage (screenshot) + `check`/`lint`/`test`
