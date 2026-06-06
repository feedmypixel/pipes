# Tasks: Side panel surface

From `tasks/prd-sidepanel.md`. Persistent companion to the popup: denser owner-grouped status,
sticky health summary, controls (filter / collapse / sort), and a live poll while open.

## Parent tasks

- [ ] 0.0 Create feature branch
- [ ] 1.0 Manifest — register `chrome.sidePanel` (`side_panel.default_path`); open on a user
      gesture from the popup
- [ ] 2.0 Service worker — `onMessage` `poll` handler running `poll()` (worker stays the single
      owner of notifications + badge)
- [ ] 3.0 Side panel shell — full-height layout, sticky health summary + live indicator
- [ ] 4.0 Status list — reuse `groupByOwner` + `Row`, denser variant
- [ ] 5.0 Controls — filter, collapse/expand groups, sort; persist choices in storage
- [ ] 6.0 Active poll while open — ~10s message loop + indicator state + `$effect` teardown
- [ ] 7.0 States (empty / all-green / loading) + open mechanism wired from the popup
- [ ] 8.0 Tests (filter/sort/collapse pure helpers + message handler) + verify loaded-unpacked
