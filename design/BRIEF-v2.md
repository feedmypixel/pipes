# Pipes v2 design brief — in-app notifications + form states (+ side panel)

Extends `design/v1`. Same system (tokens in `design/v1/assets/pipes.css`, OKLCH status
palette, cool-slate neutrals, Pixel Blue `#3194FC` for identity only, system font, Lucide).
Mock everything in **light + dark**, annotate colours/spacing (4px rhythm). These are the
pieces v1 didn't cover.

## 1. In-app notifications (NEW — v1 only had OS notifications)

Both toasts and inline banners (decided).

- **Toasts** — corner-anchored, auto-dismiss. Variants: success (green), error (red),
  info/neutral, using the status palette + `--shadow-lg`. Anatomy (icon + message + optional
  action), stacking of multiple, enter/exit motion (respect `prefers-reduced-motion`).
- **Undo toast** — the delete pattern: "Connection removed · Undo", ~5s lifetime with a
  subtle countdown/progress cue, the Undo affordance. This is the primary destructive-action
  pattern.
- **Inline banner** — top-of-section message (success/error), the portal `form-message`
  equivalent, in document flow (not floating). Anatomy + when to use vs a toast.

## 2. Form states (adopting our forms spec, Pipes-skinned)

Field order is fixed: label → hint → **error** → input → below.

- **Field in error** — red input border (`--failed`), inline error text **above the input,
  between hint and input** (`--failed`, normal weight, no icon). Show the focus-visible brand
  ring too.
- **FormSummary** — a top-of-form error panel (`role="alert"`), listing errors that link to
  the failing fields. Treatment + spacing.
- **`below` async-availability line** — states busy / ok / bad (text-only, `aria-live`), e.g.
  "GitHub detected, signed in as @x" (ok) and "Could not validate" (bad).
- Apply to the **add-connection form** (host / token) so we can see all states on a real form.

## 3. Side panel (if it's the next surface)

Confirm/refresh the v1 side panel: denser popup rows + a sticky health summary
("N failing · N green · N other") + the auto-refresh indicator. Add the **active-poll
"live · 10s"** indicator treatment (faster polling while the panel is open).

## Tokens

Mostly reuse existing. Flag if any new token is needed (toast elevation we have via
`--shadow-lg`; a toast z-index / stack offset may be worth a token). Status error tokens
(`--failed`, `--failed-bg`, `--failed-line`) already exist.

Deliver: the states above, light + dark, plus any new token values (hex/OKLCH) annotated.
