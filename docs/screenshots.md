# Refreshing the store screenshots

Two commands, no manual capture, no real work data in the images:

```sh
pnpm capture   # real Chrome screenshots the surfaces from a mock scene → store-screenshots/auto/
pnpm frame     # wraps each capture in the marketing frame → store-screenshots/framed/
```

Then upload the framed files in the Chrome Web Store dashboard. The asset list (which file maps to
which listing slot) lives in [`chromewebstore.md`](chromewebstore.md).

## 1. The scene

`src/lib/dev-extension.ts` seeds two connections with friendly labels (`feedMyPixel`, `Work`) across two
owners, and a spread of states in one view: a failing `main` (the loud red headline), running, draft
and bot PRs, distinct author avatars (pixel-art + the feedMyPixel brand mark, synthetic), and the
viewer set so the **All / Mine** toggle has rows on both sides. The provider APIs are stubbed, so
nothing real is ever shown. Adjust the scene by editing `seedData()`.

## 2. Capture

`scripts/capture-screenshots.mjs` starts `pnpm dev`, opens each surface in a real (non-headless)
Chrome window at `deviceScaleFactor: 2`, sets the viewport width + colour scheme per target, and
screenshots into `store-screenshots/auto/`. Headed Chrome matters: headless renders the status icons
slightly off. Edit the `TARGETS` array to change which surfaces, themes, widths, or crops are shot.

## 3. Frame

`scripts/frame-store.mjs` wraps a capture in the brand frame: navy backdrop, headline + subline on
the left, the surface in a window chrome on the right. Each entry in `SLOTS` sets the capture,
headline copy, and output path; the marquee tile overrides the canvas size. Run one slot with
`pnpm frame <slot>` (e.g. `pnpm frame marquee`) or all of them with `pnpm frame`.

Outputs (1280×800 unless noted):

| Slot             | File                   | Note                  |
| ---------------- | ---------------------- | --------------------- |
| `sidepanel-dark` | `1-sidepanel-dark.png` | hero                  |
| `author-light`   | `2-author-light.png`   | author attribution    |
| `popup-dark`     | `3-popup-dark.png`     |                       |
| `options-dark`   | `5-options-dark.png`   |                       |
| `marquee`        | `7-marquee-tile.png`   | 1400×560 promo banner |

`4-notification.png` (toast mock) and `6-promo-tile.png` (440×280, headline only) are hand-made, not
part of the pipeline.

## 4. Update the listing

Check the framed files against the asset table in [`chromewebstore.md`](chromewebstore.md), then
upload them in the Chrome Web Store dashboard (screenshots are not part of the extension zip, so they
are a manual dashboard step).
