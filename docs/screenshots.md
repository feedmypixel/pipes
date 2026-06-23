# Refreshing the store screenshots

Two pieces make this repeatable and keep real work data out of the images:

1. A **curated mock scene** in `src/lib/dev-chrome.ts` that the surfaces render in dev. The provider
   APIs are stubbed and the data is invented, so nothing real is ever shown.
2. A **framing script** (`scripts/frame-screenshots.mjs`) that turns a raw capture into a 1280x800
   store frame.

The CWS asset list (sizes, which screenshots) lives in [`chromewebstore.md`](chromewebstore.md).

## 1. The scene

`dev-chrome.ts` seeds two connections with friendly labels (`feedMyPixel`, `Work`) across two
owners, and a spread of states in one view:

- A failing `main` (the loud red headline) plus a couple of green and a running one.
- PRs/MRs that are failing, running, a draft, and a bot (Dependabot).
- Distinct **avatars** per row (DiceBear, synthetic) and the viewer is `octo-org`, so the
  **All / Mine** toggle has rows on both sides.

Adjust the scene by editing `seedData()` in `dev-chrome.ts`. Avatars come from DiceBear
(`api.dicebear.com`), so they need a network connection while capturing.

## 2. Capture

1. `pnpm dev`.
2. Open each surface at its **dev-server URL in a normal browser tab** (not the loaded extension):
   - side panel: `http://localhost:5173/src/sidepanel/index.html`
   - popup: `http://localhost:5173/src/popup/index.html`
   - options: `http://localhost:5173/src/options/index.html`

   The mock scene only renders here. `dev-chrome.ts` installs the fake `chrome.*` + seeded data
   **only when the real `chrome.*` is absent**, so the loaded extension shows empty storage, a plain
   tab shows the scene.

3. **Size the viewport** to the surface width with DevTools device mode (side panel ~360px, popup
   440px) so the capture matches the real surface.
4. **Both themes:** DevTools, command palette, "Show Rendering", then set
   **Emulate CSS prefers-color-scheme** to `light` or `dark`. The surfaces follow it.
5. Capture at a clean device-pixel ratio (a Retina screen gives crisp 2x output) and save the raws
   into `store-screenshots/` (keep the existing names so the framed outputs line up).

Spread **light and dark across the set** so the listing shows Pipes respects the OS theme.

## 3. Frame

```sh
pnpm frame -- store-screenshots/1-sidepanel.png store-screenshots/framed/1-sidepanel-failures.png
pnpm frame -- store-screenshots/2-popup.png     store-screenshots/framed/3-popup.png --dark
```

The script scales the capture to fit, rounds its corners, and centres it on a 1280x800 canvas
(`--dark` uses the dark canvas, pair it with a dark capture). Tweak the margin, radius, or canvas
colours at the top of `scripts/frame-screenshots.mjs`.

## 4. Update the listing

Drop the framed files into `store-screenshots/framed/`, check them against the asset table in
[`chromewebstore.md`](chromewebstore.md), then upload them in the Chrome Web Store dashboard
(screenshots are not part of the extension zip, so they are a manual dashboard step).
