# Pipes — "Replace token" spec

Companion to `README.md`. Visual reference: **`Pipes - Replace token.html`** (interactive prototype panel → options, every state in light + dark). Reuses `Field`, `PasswordInput`, `Button`, `FormSummary`, `Banner`, `Toast` and existing tokens. No new tokens.

## Problem
A 401 today means delete + re-add, which drops every watched repo for that connection. Replace token updates the token **on the existing `Account`** so `watchedRepos[].accountId` stays valid.

## 1 · Row trigger (Options › Connections)
Order: `dot · label/host · token-state · Replace token · delete`.

| | Healthy | Token failing (401/403) |
|---|---|---|
| Dot | `--success` | `--failed` |
| Row | — | `box-shadow: inset 2px 0 0 var(--failed)` |
| Token state | `token-ok` message icon (16px) + `token saved` (`--success`) | `token-bad` message icon (16px) + `token rejected` (`--alarm-ink`) |
| Trigger | `icon-button` (30px, as the bin) with lucide `key-round` | same, unchanged (neutral) |
| Note line | — | “GitHub returned **HTTP 401**. 4 watched repos are paused until you replace the token.” `--text-2`, `--font-size-sm`, aligned to the label |

Trigger: icon-only, `aria-label="Replace token for {label}"`, `use:tooltip={'Replace token'}` (from `src/lib/tooltip.ts`, not native `title`), `aria-expanded`, `aria-controls` → form id. Key and bin sit 4px apart. Hidden while that row is open.

Bin: swap native `title="Remove"` for `use:tooltip={'Remove'}` and make its label specific: `aria-label="Remove {label} connection"`. One row open at a time. Row is `flex-wrap` so actions wrap below the label at narrow widths.

## 2 · Inline edit
Renders inside the `<li>`, below the row: `padding: var(--space-2xl) var(--space-3xl) var(--space-3xl)`, `border-top: 1px solid var(--border)`, `background: var(--surface-2)`. `<form aria-label="Replace token for {label}">`.

Top to bottom:
1. `Banner variant="err"` — server failure after Save.
2. `FormSummary` — client errors after Save.
3. `Field name="token-{id}" label="New personal access token" mono` with hint “Must sign in as **@user** on host. Watched repos and settings are kept.” + the existing `token-help` details. `below` = validation line.
4. Button group: `Save token` (primary, submit, `key-round`) · `Validate` (secondary, `badge-check`) · `Cancel` (text button).

Behaviour (mirrors Add a connection):
- **Validate, empty** → field error “Enter a token”, focus field.
- **Validate** → `below` busy “Validating…” → ok “Signed in as @user” / bad “Could not validate, check the token and its permissions” / bad “Signed in as @x, not @user”.
- **Save, empty** → FormSummary (“Enter a token” → `#field`) + field error.
- **Save** → `submitting` (“Saving token…”, the only disabled moment) → validate →
  - 401/403: Banner “**Couldn’t replace token.** GitHub returned HTTP 401, the token may be expired or missing a permission”.
  - different account: Banner “**Couldn’t replace token.** It signs in as @x, not @user. [Add it as a new connection instead]” — link scrolls to the add form, prefilled with host + token. Blocked because watched repos belong to the original account.
  - ok: write token (+ `user`), collapse, token-state reads `token replaced` until reload, focus → trigger, `toastSuccess('Token replaced', '{label} is watching {n} repos again')`, clear `failedRepos[id]`, `loadRepos(account)`, ask the worker to poll now.
- **Cancel / Esc** → collapse, discard input, focus → trigger.
- Field errors clear on input (existing `clearTokenIfValid` pattern).

## 3 · Panel banner (TopAlerts)
Auth failures (401/403) only: the strip becomes `<div role="status">` (a link can’t nest inside the current `<button>`), with a trailing `<button class="issue-link" aria-label="Replace token for {label}">Replace token</button>`. Message copy unchanged. `flex-wrap` so the action drops under the message at narrow widths. Other errors (network, 5xx) keep today’s whole-strip button to Settings.

Colour: copy and action use `--text` (action underlined, `--weight-bold`), icon stays `--pending`. Icon: the solid **warning** message icon (see Message icons), replacing the outline `triangle-alert`. Today’s `--pending` text on `--pending-bg` is ≈ 2:1 in light, which fails AA.

Deep link: open or focus `options/index.html#replace={accountId}`. On load and `hashchange`: open that row, `window.scrollTo` it into view, focus the field, 1.4s `--brand-soft` highlight (skip under `prefers-reduced-motion`), then clear the hash. New prop: `onReplaceToken(id)`.

## Data
Add `Account.user?: string`, captured from `validateToken().user` on add. Legacy accounts without it: skip the same-account check and the “Must sign in as” hint; set `user` on first successful replace.

## Accessibility notes
- `below` is `aria-live="polite"`; Banner err + FormSummary are `role="alert"`.
- New failing-row text uses `--alarm-ink` (≈ 5.5:1 light).
- Out of scope, worth a ticket: `--failed` on `--failed-bg` and `--success` on `--surface` are under 4.5:1 in light (existing field errors, banners, “token saved”).

## Message icons (MessageIcon v2)
Options, banners and toasts move from outline Lucide glyphs to the panel's solid style. Extend `MessageIcon.svelte` using **StatusIcon geometry**: solid circle `--circle`, glyph `--ink` (default `--status-ink`) at `round(size * 0.66)`, `stroke-width: 3`, round caps/joins, `aria-hidden` (the adjacent text carries meaning).

| Variant | Fill | Glyph (24 viewBox) | Used in |
|---|---|---|---|
| success | `--success` | `M4.5 12.5l4.5 4.5L20 6` | Banner ok, success toast |
| error | `--failed` | `M6 6l12 12M18 6L6 18` | Banner err, error toast (was a triangle) |
| warning | `--pending` triangle | `M12 3.6 21.6 20.2H2.4Z` (fill + 3px round-join stroke), ! = `M12 9.6v4.6` 2.6px + dot at 17.4 | Panel connection banner, PermissionNote |
| info | `--brand`, ink `--brand-ink` | `M12 11v7` + dot at 6.5 | Info toast |
| token-ok | `--success` | key: `circle 7.5,12 r3.5` + `M11 12h9.5M17.5 12v3.5` | Connection row "token saved" |
| token-bad | `--failed` | same key | Connection row "token rejected" |
| lock | `--neutral` | `rect 5,11 14×9.5 rx2` (filled) + `M8 11V8a4 4 0 0 1 8 0v3` | Security note |

Sizes: 16px inline (rows, banners), 18px toasts, 30px only for display. Warning is the one non-circle so it doesn't rely on colour alone. White glyph on `--pending` is low contrast, the same as the panel's pending icon; fine because it's decorative next to text.
