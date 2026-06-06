# Tasks: Side panel surface

From `tasks/prd-sidepanel.md`. Persistent companion to the popup: denser owner-grouped status,
sticky health summary, controls (filter / collapse / sort), and a live poll while open.

## Parent tasks

- [x] 0.0 Create feature branch
- [x] 1.0 Manifest — register `chrome.sidePanel` (`side_panel.default_path`); open on a user
      gesture from the popup
- [x] 2.0 Service worker — `onMessage` `poll` handler running `poll()` (worker stays the single
      owner of notifications + badge)
- [x] 3.0 Side panel shell — full-height layout, sticky health summary + live indicator
- [x] 4.0 Status list — reuse `groupByOwner` + `Row`, denser variant
- [x] 5.0 Controls — filter, collapse/expand groups, sort; persist choices in storage
- [x] 6.0 Active poll while open — ~10s message loop + indicator state + `$effect` teardown
- [x] 7.0 States (empty / all-green / loading) + open mechanism wired from the popup
- [x] 8.0 Tests (filter/sort/collapse pure helpers + message handler) + verify loaded-unpacked
