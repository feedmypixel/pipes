# Pipes — forms & in-app notifications spec (v2)

Companion to `README.md` (the v1 surface handoff). Open `Pipes - Forms.html` for the
visual reference — every state below is shown there, light + dark. This file is the
**implementation contract**: build these as Svelte components in the existing codebase,
following the portal `forms.md` conventions, skinned with the Pipes tokens.

> **Token names.** The design HTML uses `--p-*` internally; the **app's tokens drop the prefix**:
> `--p-failed` → `--failed`, `--p-failed-bg` → `--failed-bg`, `--p-brand` → `--brand`,
> `--p-success` → `--success`, `--p-pending` → `--pending`, `--p-text-3` → `--text-muted`, etc.
> Build against the app's names.

---

## A. Forms

### Field order — fixed, always
**label → hint → error → input → below.** Never reorder.
- **Hint** only when there's something useful to say; omit on obvious fields. It is not a fallback for a missing label.
- **Error** sits **above the input** so a screen reader hits it before the control. Colour `--failed`, normal weight, **no icon** (icons inside inline errors got noisy and clashed in dark mode).
- **below** is reserved for **async-availability** feedback only (token validation, provider detection) — not general guidance.

### Required vs optional — GOV.UK convention
Fields are **implicitly required**. Mark optional fields with a lowercase `(optional)` tag next to the label. **No `*` markers.**

### Validation triggers
| Trigger | What runs |
|---|---|
| `blur` | this field's sync rules; toggle error state |
| `input` | if the field currently has an error, re-validate and clear when valid. **Never introduce a new error mid-typing.** |
| debounced `input` 300ms | async availability for fields that have one |
| `submit` (client) | all sync rules; render FormSummary; focus first error; block submit |
| `submit` (server) | source of truth — re-render with errors; always wins |

### `below` async-availability indicator
A paragraph after the input, `aria-live="polite"`, **text-only (no icons)**, coloured by state:
| State | Colour | Use |
|---|---|---|
| `busy` | `--text-muted` | request in flight ("Validating…") |
| `ok` | `--text-secondary` | field is fine ("GitHub detected, signed in as @feedmypixel") — use sparingly |
| `bad` | `--failed` | cannot be submitted as-is ("Could not validate, check the token and host") |
Return `undefined` (hide it) for the plain "available" case when a positive line adds nothing. Only show `bad` when submit truly cannot proceed.

### FormSummary
Top-of-form panel, `role="alert"` (announced on render). Renders nothing when there are no errors.
- Heading "There's a problem", colour `--failed`.
- A **bullet-less list** (`list-style:none`) of errors; each item is an in-page anchor to the failing field's id (`#${name}`).
- Background `--failed-bg`, 1px `--failed-line`, 4px radius.

### ARIA contract
- Input `id` = field `name`.
- `aria-describedby` chains the hint id and error id (space-separated when both present).
- `aria-invalid="true"` only when errored; absent otherwise.
- Native `required` on the input itself (not the Field wrapper).
- FormSummary `role="alert"`; each item links to the field id.

### `<PasswordInput>`
Variant of the input with an internal **Show / Hide** toggle (no consumer wiring). Defaults `autocomplete="new-password"` for credential-setup; override to `current-password` on sign-in.

---

## B. Submit buttons (house rule — important)

- **A submit button is ALWAYS pressable.** Pressing an incomplete/invalid form is how the user *invokes* validation — render the summary, show inline errors, move focus to the first one.
- **Never disable submit until valid. Never grey it out waiting for input.** A disabled button is a dead end with no explanation. **A user must never be left at a dead end.**
- **The only time submit is disabled is after it has been pressed** — while the submission is in flight — so a second click can't fire. Show a spinner + a "…" label (e.g. "Adding connection…"), then resolve to a result (banner / toast / next screen).
- Secondary actions are a link-styled-as-button beside the primary (GOV.UK button-group), not nested inside it.

---

## C. Errors — where each kind renders
One consistent location per kind, on every form, top to bottom:
1. **Server message** (`$message`) — a `form-message` banner at the **very top of the form**.
2. **FormSummary** — client-validation list, directly below the server banner.
3. **Inline field error** — above each failing input, via the Field's `error`.

---

## D. In-app notifications

### Inline banner (`form-message`)
A message **in document flow** (not floating), at the top of a form/section. Variants `ok` (`--success-bg` / `--success-line` / `--success`) and `err` (`--failed-*`). 4px radius, padding `11px 14px`. Leads with a **solid status icon** (see Icons).

### Toast
Corner-anchored, auto-dismissing, on the **options/settings** surface. Anatomy: **status icon + message (+ optional action) + dismiss ×**. Width **320px**, inset **16px** from the corner, anchored **bottom-right**, stacked **newest-on-top** with a **10px** gap. Elevation `--shadow-lg`. A **coloured left board** marks the variant — a **3px left border in the status colour with square top-left & bottom-left corners** (right side keeps the 4px radius).
- Variants: **success** (`--success`), **error** (`--failed`), **info/neutral** (`--brand`).
- Enter: 0.22s rise+fade. Exit: 0.4s fade. **Respect `prefers-reduced-motion`** (no animation).
- Never put a blocking error or a required choice in a toast.

### Undo toast (destructive-action pattern)
Single line "Connection removed · Undo", ~5s lifetime, dismissing with a **subtle fade — no countdown bar**. This is the primary delete pattern (remove a connection / unwatch). The title and Undo action are vertically centered on one line.

### Inline banner vs toast — the rule
- **Inline banner** = the **outcome of the thing in front of you** (a submit result, a validation failure, a section state). Stays put, in flow, until resolved. Use for: add-connection success/failure, token-expired on a connection, "no repositories match".
- **Toast** = a **transient confirmation of an action that already succeeded**, where attention has moved on. Auto-dismisses. Use for: settings saved, refresh triggered, and the **undo** pattern on delete.

---

## E. Status / message icons
**Solid-fill shapes with a white symbol** (matching the status circles), not line icons:
- **Success / valid** — solid `--success` circle, white check.
- **Error / failure** — solid `--failed` triangle, white exclamation.
- **Neutral warning** (no status colour, e.g. the self-hosted permission note) — solid **`--pending` (amber)** triangle, white exclamation.
- **Info toast** — solid `--brand` circle, white "i".
Pipeline **status** icons (in lists/rows) keep their own set: solid circle + white symbol per state (success check, failed ✗, running spinner, pending pause, canceled slash, skipped », unknown dot). The status **word** is never inline — it lives in the element's `title`.

---

## F. Radii & new tokens (everything else reuses v1)
All form chrome — inputs, buttons, banners, FormSummary, toasts, cards — uses a **4px** corner radius (status icons/pills stay fully round). The toast left board is square (top-left & bottom-left `0`).
```
--toast-z:      2147483000;   /* stack context above surface chrome (extension overlay range) */
--toast-gap:    10px;         /* vertical offset between stacked toasts */
--toast-width:  320px;        /* toast width; inset 16px from the anchored corner */
```
Elevation reuses `--shadow-lg`; the left-board accent reuses `--success` / `--failed` / `--brand`. Status error tokens (`--failed`, `--failed-bg`, `--failed-line`) already exist.

---

## G. Copy style
- Sentence case on headings and eyebrows. **No all-caps.**
- **Hyphens (-), not em-dashes (—)** in copy.
- **No trailing full stops** on short copy — hints, labels, buttons, single-sentence errors. Join a two-clause error with a comma ("This account is locked, contact support").
- `(optional)` lowercase, parenthesised, after the label.

## H. What we deliberately don't do
- No form library beyond SuperForm.
- No `*` required markers.
- **No submit-disabled-until-valid.**
- No keyboard-shortcut hints in submit rows.

## Files
- `Pipes - Forms.html` — interactive reference (open in a browser); all states, light + dark.
- `assets/forms.css` — form-state, banner, toast, undo, and `below` styles (uses `--p-*`; map to app tokens above).
- `assets/forms.js` — renders the reference mocks; not shipped.
- Reuses `assets/pipes.css` (tokens), `assets/components.js` (status icons), `assets/logos.js` (the tick mark).
