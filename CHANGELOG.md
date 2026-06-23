# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.3.0](https://github.com/feedmypixel/pipes/compare/v1.2.0...v1.3.0) (2026-06-23)

### Features

- author attribution on rows (who caused this?) ([731414f](https://github.com/feedmypixel/pipes/commit/731414f9b10d30e5604760c8929d056b523b97b4))
- **author:** colour avatars at rest, greyscale on hover ([2b6d4d4](https://github.com/feedmypixel/pipes/commit/2b6d4d44a0ad5df0fb2196a5fa33b330ba1ebd43))

### Bug Fixes

- **author:** keep avatars in colour on hover ([e6af2c8](https://github.com/feedmypixel/pipes/commit/e6af2c8fa25d4d6ed47cb1513501163439aee50d))
- review follow-ups for author attribution ([b9767ad](https://github.com/feedmypixel/pipes/commit/b9767addbe8f5f15b149bbcc85de2460f9e51119))
- **showcase:** FilterBar demo fills its container ([1b5b620](https://github.com/feedmypixel/pipes/commit/1b5b620bdade25842b77fb9bfad7272a974205e2))

## [1.2.0](https://github.com/feedmypixel/pipes/compare/v1.1.1...v1.2.0) (2026-06-18)

### Features

- show the connection label as the panel group header ([ee61879](https://github.com/feedmypixel/pipes/commit/ee61879c40b6e24ced2d2b719db6471e0383f0d3))

## [1.1.1](https://github.com/feedmypixel/pipes/compare/v1.1.0...v1.1.1) (2026-06-17)

### Bug Fixes

- scope the failing badge + PR count to the All/Mine view ([4e66d0e](https://github.com/feedmypixel/pipes/commit/4e66d0e9d18e12475f370fe4c205b034583755be))

## [1.1.0](https://github.com/feedmypixel/pipes/compare/v1.0.0...v1.1.0) (2026-06-17)

### Features

- add a "Mine" scope filter to the side panel ([9d16a27](https://github.com/feedmypixel/pipes/commit/9d16a2766ee176c7fbb022db33530925a7479352))

### Bug Fixes

- repopulate identity on upgrade so "Mine" works immediately ([f1d8dbc](https://github.com/feedmypixel/pipes/commit/f1d8dbce3b13451a7ffd14d07905e3884a21e406))

## [1.0.0](https://github.com/feedmypixel/pipes/compare/v0.1.0...v1.0.0) (2026-06-16)

### Bug Fixes

- pick GitLab pipeline status by id, not update time ([4743030](https://github.com/feedmypixel/pipes/commit/4743030a63e478532f833aa8d1ead1d66f58b50b))

## 0.1.0 (2026-06-13)

### Features

- bare elapsed timer + seconds in the hover timestamp ([d35f7de](https://github.com/feedmypixel/pipes/commit/d35f7de4d71765d6a66f2a3a3ba0c8158d2919c0))
- branch-centric model — drop ghost (deleted-branch) refs (2.0) ([ebe605a](https://github.com/feedmypixel/pipes/commit/ebe605a7054f7dfc48daa13dd67da521ac071fb0))
- central pino logger, level-gated (5.0) ([f6db683](https://github.com/feedmypixel/pipes/commit/f6db68385fb5820124bfcb14b74f202075ca592c))
- **css:** rem scale tokens + Josh Comeau reset + docs/css.md ([ed839a8](https://github.com/feedmypixel/pipes/commit/ed839a80505c583a9521d63f0e621fdc111bcb3b))
- **dev:** in-tab chrome.\* shim + seed for surface previews ([ebe48b7](https://github.com/feedmypixel/pipes/commit/ebe48b7a05e776725a1917c34dcd6db2c6aa70ac))
- **forms:** Field/Input/PasswordInput/FormSummary + Banner/Toast notifications ([3e5e36d](https://github.com/feedmypixel/pipes/commit/3e5e36daf8bb0b064e28bf6b9f54451d9ca4509e))
- **foundation:** design tokens + base/a11y styles, wired into surfaces ([fa2d48c](https://github.com/feedmypixel/pipes/commit/fa2d48c6e56f9824dc5e20b859717d9be3a968b6))
- **foundation:** dev-only component showcase ([7c6bf69](https://github.com/feedmypixel/pipes/commit/7c6bf6953ee775bd08ac1fc84b0227d4517851fc))
- **foundation:** dev-only console theme override ([06cd33e](https://github.com/feedmypixel/pipes/commit/06cd33ea7b0c16f4c68211c4b4c31e2c8d05655f))
- **foundation:** shared primitives (StatusIcon, RefChip, RelativeTime, Row) ([b557855](https://github.com/feedmypixel/pipes/commit/b557855ad09ea37b95754938f8c94021a78c79f8))
- GitLab default-branch tooltip shows the commit message ([16431e0](https://github.com/feedmypixel/pipes/commit/16431e04ddd3ddc4a8375569dfa7c99fe3875d69)), closes [#123](https://github.com/feedmypixel/pipes/issues/123)
- live "running Xm" elapsed timer on in-progress rows ([52b034f](https://github.com/feedmypixel/pipes/commit/52b034f5d99f899a539866709d77e2440658d97d))
- **notify:** contextMessage + Open button; drop the title emoji (7.0) ([1c33a7c](https://github.com/feedmypixel/pipes/commit/1c33a7c3860806fa0b8dc8f19b54c477f65f35b4))
- **notify:** status-icon notifications (red X / green tick spheres) ([84082a7](https://github.com/feedmypixel/pipes/commit/84082a7da37588728fe972aa00874a4270ecc153))
- **options:** connections, validate, repo picker, settings ([2bea862](https://github.com/feedmypixel/pipes/commit/2bea86287181803dad369a58f197f005cf729e47))
- **options:** frame token-permissions help as a question ([bc5a2b9](https://github.com/feedmypixel/pipes/commit/bc5a2b9ff2ca647039a2fcea78327768f511d0bd))
- **options:** host as a select (GitHub / GitLab / Self-hosted) ([99c7bc1](https://github.com/feedmypixel/pipes/commit/99c7bc1cce94543cc505d52785d7a0e2f45ae15f))
- **options:** host normalisation + SaaS provider detection helpers ([e4ec0ac](https://github.com/feedmypixel/pipes/commit/e4ec0acbb2e5e0e443c5003122dd96d4ba3ff774))
- **options:** minimal token-permissions help (collapsible details) ([b6d111f](https://github.com/feedmypixel/pipes/commit/b6d111f7451fc0bf7e1d326c1ced9a59604b8fa6))
- **options:** refine token help - info icon, underline, no chevron/bullets ([83376cf](https://github.com/feedmypixel/pipes/commit/83376cf2d99ac961195f4f3d0dd8b1431dd6597c))
- **options:** rewire add-connection onto the form components ([30862ea](https://github.com/feedmypixel/pipes/commit/30862ea9c35ef1e9c9af1e4c4300c754e53d1302))
- **options:** token help opens into an inset surface-2 drawer with bullets ([c544ef2](https://github.com/feedmypixel/pipes/commit/c544ef2afc46e08bfbfc30ed816f5b81b21ca2ee))
- **options:** watch/unwatch + validate/add success feedback ([05dcdb1](https://github.com/feedmypixel/pipes/commit/05dcdb1a4fd14a51c4c0e3a0251a6aa7b9688786))
- pipes MV3 engine + toolchain ([2cdd969](https://github.com/feedmypixel/pipes/commit/2cdd9696b8fbb4a1cf7b30c52b370af4c0b500d1))
- poll resilience — single-flight, bounded fan-out, rate-limit handling (1.0) ([d18d2b8](https://github.com/feedmypixel/pipes/commit/d18d2b836ef8cb57204107b0f84993aaec02e714))
- **popup:** empty-state + footer polish ([26785b6](https://github.com/feedmypixel/pipes/commit/26785b66e692d0018bb9d832b16c2287d9e0b9fa))
- **popup:** glance UI (header, owner groups, alarm strip, states) ([271917c](https://github.com/feedmypixel/pipes/commit/271917c2cff474a0250775e1f56e86e2a7cfcb04))
- **popup:** pure owner-grouping + default-branch-failure count ([bd95f46](https://github.com/feedmypixel/pipes/commit/bd95f461a9e2173af12670571c992a278b05ae36))
- **popup:** show live/broken branches by default, collapse only settled ([d24ac51](https://github.com/feedmypixel/pipes/commit/d24ac511ab740b7ecdc4412c3f5a14d6fea7b8f6))
- PR/MR-centric model (2.0-5.0) ([36485f8](https://github.com/feedmypixel/pipes/commit/36485f8789e669e958a683944662b5c16f666c09))
- **providers:** listOpenChanges for GitHub + GitLab (1.0) ([c7c7615](https://github.com/feedmypixel/pipes/commit/c7c76154355f8a374a5d444a995da383fae1a3f1))
- **providers:** resilient request layer (timeouts, ETags, rate-limit back-off) ([f680524](https://github.com/feedmypixel/pipes/commit/f680524a09acd0d6a2f3654cf66650f19b796beb))
- **repo-picker:** cache storage key + owner-grouping helper ([df235fa](https://github.com/feedmypixel/pipes/commit/df235fa906097ce5c7dec16829953c74db99e2ac))
- **repo-picker:** owner-grouped picker, cache, auto-fetch, states ([0a9770f](https://github.com/feedmypixel/pipes/commit/0a9770fe951ead1c99eb0ffb98814e29b31831dc)), closes [#10](https://github.com/feedmypixel/pipes/issues/10)
- **row:** child mode for secondary branches ([4709d86](https://github.com/feedmypixel/pipes/commit/4709d86c3df1b24f94b32ab181752ed381d4bee6))
- **showcase:** add forms, banners + toasts sections ([085ec59](https://github.com/feedmypixel/pipes/commit/085ec5928ede7e9e7d530b7ce240738cde76e041))
- **showcase:** live submit demo + permnote + below-busy state ([0b8c4e7](https://github.com/feedmypixel/pipes/commit/0b8c4e7e78bbde762ae85e796e2f77196a00f372))
- **showcase:** TopAlerts variants; chore: neutral dev-example names ([841f45b](https://github.com/feedmypixel/pipes/commit/841f45b665fc9b484ff06dd172ffdda27ab1c711))
- **sidepanel:** live owner-grouped panel with filter, sort, collapse ([2c6b003](https://github.com/feedmypixel/pipes/commit/2c6b0033c38bf0de25f49fab173a7d2e4de5707e)), closes [#10](https://github.com/feedmypixel/pipes/issues/10)
- surface UX pass — shared list/alerts, connection health, glance model ([db7a0a6](https://github.com/feedmypixel/pipes/commit/db7a0a66c9ad652ae7c640e81d8515873ae154d1))
- **surfaces:** restyle filter/toggle pills ([cec5203](https://github.com/feedmypixel/pipes/commit/cec5203af0355d39f3f47c07fe595d8a1198cb79))
- **surfaces:** segmented sort + status filter, drop the per-repo collapse ([d54b71a](https://github.com/feedmypixel/pipes/commit/d54b71ae53fb7f7ee96e7494625e1a9865a403f8))
- **toasts:** tinted fill restyle + form polish ([a18014f](https://github.com/feedmypixel/pipes/commit/a18014f7e58fa05762b0a289b89e644f8a1be525))
- Tooltip component; exact time on hover over relative times ([08b70be](https://github.com/feedmypixel/pipes/commit/08b70beb767365c5bf2094b5fb84fc45d719849e))

### Bug Fixes

- a rate-limited connection no longer shows as an invalid token ([6e80c6b](https://github.com/feedmypixel/pipes/commit/6e80c6bb221ec93777d1daaeaef9ee9bc940b7b3))
- address baseline review findings ([fd8f533](https://github.com/feedmypixel/pipes/commit/fd8f53396c550999019881acd33f4c7abef9b4c0))
- bump cache version so the GitLab MR join takes effect ([0bb79c9](https://github.com/feedmypixel/pipes/commit/0bb79c9d289ac3d0e76e445ab0314c760af7d014))
- dev preview fixture shape + showcase host control ([ef82102](https://github.com/feedmypixel/pipes/commit/ef821023ee593e6ee5bf08cd0f86c0b48a51a568))
- dev-server SW connection + rename CI workflow ([#2](https://github.com/feedmypixel/pipes/issues/2)) ([5dae8ae](https://github.com/feedmypixel/pipes/commit/5dae8aed2b8fdc2cf9b472141bbebfe2d1724455))
- fetch live branches every poll (ETag); self-heal, never show ghosts ([1202022](https://github.com/feedmypixel/pipes/commit/1202022f1941a57fa321858332bfabcea620b5c3))
- GitHub repos no longer vanish + steady search input height ([10a8685](https://github.com/feedmypixel/pipes/commit/10a8685d4652973e0d36757e3a4e10331556787c))
- give the select chevron proper spacing ([decfd78](https://github.com/feedmypixel/pipes/commit/decfd789660c46390191670de609eca2ebe605a2))
- join GitLab MR pipelines by merge-request ref ([7c43376](https://github.com/feedmypixel/pipes/commit/7c433762eb5a52880ec5b07a64a05b3913c0f3e3))
- keep seconds ticking through the minute range ([8d7c60e](https://github.com/feedmypixel/pipes/commit/8d7c60eb3cda33f64e3606a27bbbd5a903f07ee2))
- keep the red fail-badge on the right ([e323e60](https://github.com/feedmypixel/pipes/commit/e323e60deb84e48880c807625ebe035df7975f5b)), closes [#88](https://github.com/feedmypixel/pipes/issues/88)
- no-disabled-buttons + tokenise white (review findings) ([a5ee44f](https://github.com/feedmypixel/pipes/commit/a5ee44f159e0be61ad903bf0469448c5d173dc86))
- **notify:** neutral 'Open' button label (PR/MR/run-agnostic) ([80ad2dd](https://github.com/feedmypixel/pipes/commit/80ad2dd6acec8b07f182f892e82c38e6cc2fddac))
- **options:** security note text flow ([572ff55](https://github.com/feedmypixel/pipes/commit/572ff5567d0476f162d4bd8f0e6aebb29eb6b5b5))
- **options:** submit the add-connection form on Enter (semantic form) ([6db5b9a](https://github.com/feedmypixel/pipes/commit/6db5b9a6de3f68ddc1a5213693584a7d56027f32))
- poll fresh (no ETag) while the panel is open, for live status ([57bfa40](https://github.com/feedmypixel/pipes/commit/57bfa40c452bc6b3711d092fb7395add1815594d))
- PR status via Actions runs (head SHA), dropping the Checks scope ([b9665b5](https://github.com/feedmypixel/pipes/commit/b9665b56d0506a39f8d419dd3bb44e6c900153c4))
- propagate rate limits from check-runs; align recover/fail notif ids ([db17c47](https://github.com/feedmypixel/pipes/commit/db17c47eab63af25d423f18cfdfcc070ed5697bf))
- reconnect the live port when the worker recycles ([f12101a](https://github.com/feedmypixel/pipes/commit/f12101a04efcc440cd75e4ca9c11fa1ad7381c8f))
- require GitHub Contents:read in copy + force-refresh bypasses throttles ([af8b632](https://github.com/feedmypixel/pipes/commit/af8b63254f737e8c0a6109d6311227a39cb0101c))
- review quick wins ([a516d61](https://github.com/feedmypixel/pipes/commit/a516d618ae4c91e3748bac60ba30313ec5e63b4e))
- roll GitHub ref status up across all workflows, not newest-run-wins ([d01dff7](https://github.com/feedmypixel/pipes/commit/d01dff7be8304e9efbb0dd539f77af73fa2ea6ea))
- say "pull request" or "merge request" per provider ([742b534](https://github.com/feedmypixel/pipes/commit/742b53448988a3a010651ea5870524ef2173fcad))
- side panel back to A-Z owners + repos (drop rank-by-worst) ([af1e81e](https://github.com/feedmypixel/pipes/commit/af1e81e1cb5ebcd1310963f1e53f4195a5cac680))
- status icon tweaks — grey ?, bigger glyph, purple skipped ([9ea15e0](https://github.com/feedmypixel/pipes/commit/9ea15e00619a93a1ebfdd795e7aedcdd6f8d4339))
- **status-icon:** larger glyphs, thicker stroke, less padding ([199d4bd](https://github.com/feedmypixel/pipes/commit/199d4bdced360ea00a27fa8e1107c8b599471695))
- stop clipping row-name descenders; tighten header gap ([7bca6d1](https://github.com/feedmypixel/pipes/commit/7bca6d11b80a5103ee61b656fd9357b5b2041d55))
- **storage:** guard get() against wrong-type values; heals corrupt accounts ([4e95067](https://github.com/feedmypixel/pipes/commit/4e950674730f5e317b87575f256a51175f88a1f7))
- tooltip on the default-branch star ([d507957](https://github.com/feedmypixel/pipes/commit/d507957aac297a3c610b00f5ea15fd5afe29d3dd))
- unknown icon grey, question mark sized to match the others ([a364611](https://github.com/feedmypixel/pipes/commit/a36461125060fb72a5a63ae665f2bb84d2b601f5))
- unknown is an ink circle that flips per theme ([b2af185](https://github.com/feedmypixel/pipes/commit/b2af18503e8746a9685cdfe0180a1f2ffe89fa23))
- unknown purple, skipped the ink invert ([6e33833](https://github.com/feedmypixel/pipes/commit/6e33833544717cae204f074cd3639f6d245fd7fb))
- unknown status icon is a violet question mark + themed tooltip ([dab8859](https://github.com/feedmypixel/pipes/commit/dab885955d49a198437aa87a310f3dcb29b90a1b))
- Vite 6 stack (working dev), lint cleanup, doc TOCs ([ab0a0f0](https://github.com/feedmypixel/pipes/commit/ab0a0f02ad5ce4c202f3925d22d3ec12df2989e5))
- worker-driven live poll loop while a surface is open ([b115d4a](https://github.com/feedmypixel/pipes/commit/b115d4a9b9dc1ae51c08a0bc67609b97d7801e29))
