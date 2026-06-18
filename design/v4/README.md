# Handoff: Pipes — popup, side panel, options, notifications

> **v2 forms & in-app notifications** are specified separately in **`FORMS.md`** (visual reference:
> `Pipes - Forms.html`). Read that alongside this file when building the options/settings forms,
> toasts, undo, and inline banners.
>
> **"Mine" scope filter** (the All/Mine authorship toggle on the filter row) is specified in
> **`MINE-FILTER.md`** (visual reference: `Pipes - Mine filter.html`).

## Overview
**Pipes** is a Chrome (Manifest V3) extension that watches **GitHub Actions** and **GitLab CI/CD** pipeline status across chosen repos and is **loud the moment the default branch breaks**. This package contains the visual + interaction design for the four user-facing surfaces: **popup**, **side panel**, **options**, and **OS notifications / toolbar icon**.

## About the design files
The files in this bundle are **design references built in HTML/CSS/JS** — a single interactive document that shows the intended look, states, and behaviour. They are **not production code to copy**. The codebase already exists: a **Svelte 5 + Vite + `@crxjs/vite-plugin` + TypeScript** MV3 extension (`src/popup/`, `src/sidepanel/`, `src/options/`, with `src/providers/`, `src/lib/storage.ts`, `src/background/` already built). **Recreate these designs as Svelte components** in that codebase, wiring them to the existing normalized model (`Account`, `Repo`, `Pipeline`, `PipelineStatus`) and `chrome.storage` subscriptions. Do not ship the HTML.

Open `Pipes - Design Handoff.html` in a browser to explore — it documents tokens, the logo, status vocabulary, a glossary, behaviour, and every surface in light + dark.

## Fidelity
**High-fidelity.** Final colours, type, spacing (4px radii), iconography, and interactions. Recreate pixel-faithfully using the codebase's patterns. The one open choice left to the developer is the **typeface** (see Design Tokens → Type).

---

## Design tokens

### Brand
- **Pixel Blue `#3194FC`** (light) / `#5AA8FF` (dark) — identity, links, focus rings only. **Never** a status colour.
- Brand-soft (tints): `oklch(0.95 0.04 256)` light / `oklch(0.30 0.07 256)` dark.
- Link: `oklch(0.55 0.17 256)` light / `oklch(0.78 0.13 256)` dark.

### Neutrals (cool slate — this is Pipes' own palette, deliberately not GitHub grey)
| Token | Light | Dark |
|---|---|---|
| bg | `#ffffff` | `#0b0f17` |
| canvas / sunken | `#eef1f7` | `#070a10` |
| surface / card | `#ffffff` | `#121826` |
| surface-2 | `#f4f6fb` | `#161d2c` |
| hover | `#eaeef6` | `#1b2333` |
| border | `#e3e8f1` | `#242d3e` |
| border-2 | `#d0d7e4` | `#2f3a4d` |
| text | `#0f1620` | `#e7ecf3` |
| text-2 | `#545e6e` | `#98a3b4` |
| text-3 (muted) | `#939dad` | `#687284` |

### Status palette — OKLCH, harmonised to the brand
All status hues share the brand's lightness/chroma, varying only hue (so nothing clashes). Format: `oklch(L C H)`, **light / dark**.
| State | Colour (light / dark) | Meaning |
|---|---|---|
| success | `0.64 0.15 152` / `0.76 0.16 152` | latest run passed |
| failed | `0.60 0.20 27` / `0.70 0.19 27` | run failed — on the default branch this is the headline alarm |
| running | `0.66 0.17 256` / `0.74 0.15 256` | in progress (animated spinner) |
| pending | `0.72 0.14 80` / `0.80 0.13 85` | queued / waiting for a runner |
| canceled / skipped / unknown | `0.60 0.025 256` / `0.72 0.025 256` (grey) | settled-neutral / not run |

Each status also needs a **bg tint** and **line/border** at the same hue (light: `oklch(0.95 0.04 H)` bg, `oklch(0.86 0.09 H)` line; dark: `oklch(0.30 0.06 H)` bg, `oklch(0.43 0.08 H)` line). See `assets/pipes.css` `[data-theme]` blocks for exact values.

### Radii
**4px** for all cards, controls, inputs, frames. Pills and status circles are fully round (`50%` / `999px`). Nothing larger than 4px except round.

### Spacing
4px base. Common: row padding `10px 14px` (popup) / `7px 14px` (dense side panel); card padding `18px 20px`; section gaps `16–28px`.

### Type
- **Default: system stack.** Sans `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`; mono `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.
- Mono is used for **refs, SHAs, timestamps, counts, owner/section labels** — anything code-like.
- The handoff exposes a live typeface switcher (System / Geist / IBM Plex / Space Grotesk) purely to preview options — **pick one** for the build (system stack ships nothing and is recommended; otherwise a licensed clean/technical face).
- Sizes: body 12.5–13px, titles 15px, headings to 21px; mono 11–13px. Weights 500–700.
- **No all-caps anywhere** (hard to read). Sentence case headings/labels.

### Icons
**Lucide** (`@lucide/svelte`) — MIT, tree-shakeable, exact aesthetic match. Import named icons; do not inline. Mapping used:
`refresh-cw` (refresh), `panel-right` (open side panel), `settings` (options), `git-branch` (ref), `external-link` (open run/new-tab), `chevron-down` (expand), `search`, `check`, `plus`, `trash-2` (remove), `lock` (token security), `triangle-alert` (error/warning + incident), `plug` (connections), `zap` (validate).

### Status icon (one unified set everywhere)
A **solid colour circle with a white symbol**, on a transparent background — the universal GitHub/GitLab convention, so no per-provider variants are needed. Symbols: success = check, failed = ✗, running = spinning arc, pending = pause (two bars), canceled = slash, skipped = » (double chevron), unknown = dot. **The status word is never shown inline — it lives in the element's `title` (hover) for scannability + accessibility.** Sizes: 20px in lists (18px dense), 30px in notifications, 40px as the toolbar icon. Stroke weight ~2.6 on the symbols.

---

## Logo / brand mark
The Pipes mark is a **green status tick** — a green circle (`#1aa05a`) with a white check, on a **transparent background**. It is the resting "all clear" signal and exactly what the extension is for. Scales cleanly to 16px.
- `assets/logo-pipes.svg` — primary (green). Use for the store icon and surface headers. A single scalable SVG covers 16/32/48/128; the build's `scripts/generate-icons.mjs` should rasterize it to those PNG sizes.
- `assets/logo-pipes-mono.svg` — **greyscale** variant (`#8a93a0`). **Use this on any surface that also shows status icons (notifications)** so the brand mark is never mistaken for a green success status.
- **Toolbar icon reflects aggregate status**: green tick when all green, red ✗ when ≥1 failing on a default branch, amber when runs are in progress. (Use `chrome.action.setIcon` per poll.)

---

## Surfaces

### 1. Popup — `src/popup/` — width **380px**, height auto up to ~580px then scroll
- **Header (dark app-bar):** dark bar (`#0d1219`-ish in both themes) with the green tick logo + "Pipes" wordmark (white) + a 2px brand underline, and right-aligned icon buttons: refresh (`refresh-cw`), open side panel (`panel-right`), options (`settings`). Icon buttons 30px, light on the dark bar.
- **Alarm strip** (only when a default branch is red): full-width red-tinted strip, pulsing red dot, "`N` failing on `main`", with a "jump ↓" link. This is the headline state — must read as alarming.
- **Body:** repos **grouped by owner** (e.g. `feedmypixel`, `whiskyinvestdirect`), **owners A–Z, repos A–Z within**. Owner header = a mono lowercase **link** (opens the owner page on the provider, new tab) + a count chip. A subtle vertical "pipe" rail runs down each owner group with the status circles sitting on it as nodes.
- **Row (shared component — reuse in side panel):** grid `auto 1fr auto` = [status circle] [name + meta] [external-link, on hover]. Name = project (owner stripped, it's the group) in mono-ish semibold. Meta line = branch ref chip (`git-branch` + name, mono) · relative time (mono). Failed/running rows get a 2px coloured left edge; the headline failed-on-main row gets a red tint + 3px edge. **Whole row links to the exact run in a new tab; for a failure it targets the failed job's log** (`title` says which).
- **Secondary refs** collapse under a repo behind a "Show N other branches" toggle (`chevron-down`).
- **Footer:** a live indicator (spinning ring) + "updated just now".
- **States to build:** `failing` (headline, default), `pr-failing` (green `main` but a PR/MR red — calm amber note, NOT the loud strip), `healthy` (green success strip), `unconfigured` (empty → "Open setup" CTA), `error` (token expired / can't reach — shows a **provider-incident banner**, see below).

### 2. Side panel — `src/sidepanel/` — width **~360px**, full viewport height, persistent
Same header + same row component, **denser** (`7px 14px` rows). Adds a **sticky health summary** under the header: `N failing · N green · N other` (tabular numbers; failing in red, green in green) and a subtle auto-refresh indicator ("30s"). Body scrolls; footer shows "auto-refresh 30s · updated 12s ago".

### 3. Options — `src/options/` — centred **720px** column on the canvas background
Cards (surface, 1px border, 4px radius), each with a mono section header. Sections, in order:
- **Connections** — list of active connections: a status dot (ok/bad), label, host (mono), token state (`check` "token valid" / `triangle-alert` "token expired"), remove button (`trash-2`).
- **Add a connection** — form (see Forms below). Fields: **Label (optional)**, **Host** (hint: "github.com, gitlab.com or a self-hosted origin"), **Personal access token** (hint: "read-only scope - never synced, never logged"; Show/Hide toggle). A **Validate** button; on success a `below` availability line shows the **auto-detected provider** + authed handle ("GitHub detected, signed in as @feedmypixel"). **The form does not ask which provider — it's detected from the host.** A permission note explains self-hosted origins request host permission at runtime. Button group: primary **Add connection** + secondary **Validate**.
- **Watched repositories** — search field + a grouped, checkbox list pulled from the API; tick to watch.
- **Settings** — **Poll interval** stepper (min 0.5 min) and **Notify when a pipeline recovers** toggle.
- **Security note** — tokens stay on device, read-only, never synced/logged.
- **Save row** (sticky) — primary "Save changes" + "All changes saved" confirmation.

### 4. Notifications & toolbar
- **OS notification** leads with the **status icon** (30px), on a **status-tinted card** (loud failure = red-tinted, recovery = green-tinted, branch failure = calm/neutral) with a 3px coloured left edge. App row shows the **greyscale** logo + "Pipes" + time. Title + message name the repo/pipeline; actions like "Open failed job" / "Snooze 1h" / "View run".
- **Fire on state transitions only** — re-polling the same failure stays silent. Default-branch failure = loud/high-priority/sticky; PR/MR = calm; recovery (red→green) = optional toast (setting).
- **Provider-incident banner** (popup): an amber strip "`GitHub` is reporting an incident · status ↗" linking to the provider status page — **shown only when there's an incident**, so users know an outage isn't their pipeline.

---

## Interactions & behaviour
- **Deep-linking:** rows open the **exact run/pipeline** (`Pipeline.webUrl`) in a **new tab** (`target="_blank" rel="noopener noreferrer"`). For failures, target the **failed job's log scrolled to the failure** — GitHub `…/actions/runs/<run>/job/<job>#step:<n>:<line>`, GitLab `…/-/jobs/<job>`. Never the repo root.
- **Grouping/sort:** by owner, alphabetical (owners and repos). Failed-on-main is surfaced via the alarm strip + red, not by reordering.
- **Hover:** rows highlight; external-link icon fades in; status word appears via `title`.
- **Running** status spins; the live indicator and (optionally) the spinner-aware toolbar icon animate. Respect `prefers-reduced-motion`.
- **Theme:** respect `prefers-color-scheme`; both light + dark are specified.
- **Show/Hide** on the token input toggles input type + button label.

## Forms (follow the portal `forms.md` spec)
- **Field order, fixed:** label → hint → error → input → below.
- **Implicit-required;** mark optional fields with a lowercase `(optional)` after the label — no `*`.
- **Errors inline above the input** in the error colour; a top-of-form summary (`role="alert"`) for client validation; **server validation wins** on submit.
- **Async availability** (token validation / provider detection) renders in the `below` line, text-only, `aria-live="polite"`, coloured by state (busy/ok/bad).
- **ARIA:** input `id` = field name; `aria-describedby` chains hint + error ids; `aria-invalid` only when errored; native `required`.
- **Submit is never disabled** (except an in-flight "Saving…"). Block via validation, not by greying out.
- Copy: sentence case, hyphens (not em-dashes), no trailing full stops on short copy.

## State management (wire to existing code)
- Read `accounts`, `watchedRepos`, `settings`, `snapshots` from `chrome.storage.local` via `src/lib/storage.ts`; **subscribe** so popup/side panel live-update when the poll loop writes new `snapshots`.
- Group `snapshots` (latest `Pipeline[]` per repo) by repo owner for display. `isDefaultBranch` + `status === 'failed'` drives the headline alarm and the toolbar/badge state.
- Options writes accounts/repos/settings; the service worker (`src/background/`) already polls, diffs, notifies, and sets the badge.
- Local UI state only: collapsed/expanded secondary refs, token Show/Hide, form validation.

## Assets
- `assets/logo-pipes.svg` (green tick), `assets/logo-pipes-mono.svg` (greyscale) — original, no third-party logos.
- **No GitHub/GitLab brand logos are used** — provider identity was dropped from the UI (grouping is by owner, status icons are universal). If you ever reintroduce provider marks, use the official SVGs per each provider's brand guidelines (nominative use), kept small + monochrome.
- Status icons + all UI glyphs come from **Lucide** / are drawn inline in `assets/components.js` for reference.

## Files in this bundle
- `Pipes - Design Handoff.html` — the interactive design doc (open in a browser).
- `assets/pipes.css` — all tokens (`:root`, `[data-theme="light|dark"]`) + component styles. **The source of truth for exact colour/spacing values.**
- `assets/logos.js` — the tick mark (and the explored pipe-eye directions, for reference).
- `assets/data.js` — sample data shaped like the real `Account`/`Repo`/`Pipeline` model.
- `assets/components.js` — status icons, the shared row, branch/ref chips, the Lucide icon set.
- `assets/surfaces.js` — popup (all states), side panel, options, notifications, toolbar badge.
- `assets/app.js` — assembles the doc; not needed in the extension.
- `assets/logo-pipes.svg`, `assets/logo-pipes-mono.svg` — final mark.
