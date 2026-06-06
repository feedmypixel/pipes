# Forms & in-app notifications

How Pipes builds forms and feedback. The implementation contract is `design/v2/FORMS.md`
(the spec) + the portal `forms.md` conventions; this documents what shipped and how to use it.
Each component owns its styling in a scoped `<style>` (no global form stylesheet); only design
tokens in `tokens.css` are shared. A component renders correctly with zero global classes.

See every state live: the component showcase at `http://localhost:5173/src/showcase/`
(`pnpm dev`), light + dark via the theme switcher.

## Components

| Component             | File                                              | Use                                                                          |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Field`               | `lib/components/forms/Field.svelte`               | Wraps one input: label → hint → error → input → below, with the ARIA wiring. |
| `Input`               | `lib/components/forms/Input.svelte`               | Text/url input; reads its id/aria from the surrounding `Field`.              |
| `PasswordInput`       | `lib/components/forms/PasswordInput.svelte`       | Input with an internal Show/Hide toggle.                                     |
| `FormSummary`         | `lib/components/forms/FormSummary.svelte`         | Top-of-form error list, `role="alert"`, links to failing fields.             |
| `MessageIcon`         | `lib/components/forms/MessageIcon.svelte`         | Solid status/message glyph (success/error/warning/info).                     |
| `Banner`              | `lib/components/Banner.svelte`                    | Inline `form-message` (in document flow).                                    |
| `Toast` / `ToastHost` | `lib/components/Toast.svelte`, `ToastHost.svelte` | Corner-anchored transient confirmation; `ToastHost` renders the stack.       |
| `toasts` store        | `lib/toasts.svelte.ts`                            | `toastSuccess` / `toastError` / `toastInfo` / `toastUndo` + `dismiss`.       |

## Field order — fixed

**label → hint → error → input → below.** Never reorder.

- **Hint** only when it adds something; omit on obvious fields.
- **Error** sits **above the input** (a screen reader hits it before the control). Colour
  `--failed`, normal weight, no icon.
- **below** is for **async-availability** feedback only (token validation, provider
  detection) — pass `{ state: 'busy' | 'ok' | 'bad', text }`. Return `undefined` for the plain
  "available" case when a positive line adds nothing.

Fields are **implicitly required**; mark optional ones with `optional` (renders a lowercase
`(optional)` tag). No `*` markers.

## ARIA contract

Handled by `Field` — consumers just pass `name` + `error`:

- input `id` = the field `name`.
- `aria-describedby` chains the hint id + error id (space-separated when both present).
- `aria-invalid="true"` only when errored; absent otherwise.
- `FormSummary` is `role="alert"`; each item is an in-page anchor to `#${name}`.

## Validation triggers

| Trigger                    | What runs                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `blur`                     | the field's sync rules; toggle error state                                                                         |
| `input`                    | if the field currently has an error, re-validate and clear when valid. **Never introduce a new error mid-typing.** |
| debounced `input` (~300ms) | async availability, for fields that have one                                                                       |
| `submit`                   | all sync rules; render `FormSummary`; focus the first error; block submit                                          |

The components are unopinionated about _where_ rules live — the options form wires
`onblur` / `oninput` handlers to `Input` and owns the rules. See `src/options/App.svelte`
(`checkHost` / `checkToken` / `clearHostIfValid` / `clearTokenIfValid`).

## Submit buttons — house rule

- **Always pressable.** Pressing an invalid form is how the user _invokes_ validation: render
  the summary, show inline errors, focus the first one. Never disable-until-valid, never grey
  out waiting for input — a disabled button is a dead end with no explanation.
- **Disabled only in-flight** — after press, while the round-trip runs, so a second click
  can't fire. Show the spinner + a "…" label (`class:submitting` + "Adding connection…"), then
  resolve to a banner / toast / next screen.

## Errors — where each kind renders

Top to bottom, one location per kind:

1. **Result banner** (`Banner`) — the submit outcome, at the top of the form.
2. **`FormSummary`** — the client-validation list, below the banner.
3. **Inline field error** — above each failing input, via the `Field`'s `error`.

## In-app notifications

**Inline banner vs toast:**

- **Banner** = the **outcome of the thing in front of you** (submit result, validation
  failure, section state). Stays in flow until resolved. Add-connection success/failure,
  "no repositories match".
- **Toast** = a **transient confirmation of an action already done**, attention moved on.
  Auto-dismisses. Settings saved, refresh triggered, and the **undo** pattern.

Never put a blocking error or a required choice in a toast.

**Toast store** — `toastSuccess(title, message?)` (4s), `toastError` (6s), `toastInfo` (4s),
`toastUndo(title, onUndo)` (5s, the destructive-delete pattern: "Connection removed · Undo").
`ToastHost` must be mounted once on the surface.

**Toast styling** — corner-anchored bottom-right, 320px, newest-on-top, `--shadow-lg`,
auto-dismiss, `prefers-reduced-motion` respected. The fill is a **tint derived from the status
colour** (`--toast-{success,error,info}-fill` / `-edge` tokens, themed: a soft `color-mix` in
light, the saturated `-bg`/`-soft` tints in dark so the colour reads on a dark surface).

> **Divergence from `design/v2/FORMS.md`.** The v2 spec drew the toast variant as a 3px
> coloured **left board** on a surface card. Shipped instead with a full tinted fill and all
> corners rounded (the board read as heavier than the confirmation deserved). The variant
> still maps to `--success` / `--failed` / `--brand`.

## Icons

`MessageIcon` — solid shape + white symbol (matches the status circles), not line icons:
success = `--success` circle + check; error = `--failed` triangle + "!"; warning (neutral,
e.g. the permission note) = `--pending` amber triangle + "!"; info = `--brand` circle + "i".

## Copy style

Sentence case, no all-caps. Hyphens, not em-dashes. No trailing full stops on short copy
(hints, labels, buttons, one-sentence errors); join a two-clause error with a comma.
`(optional)` lowercase after the label.

## Testing

Two vitest projects (`vitest.config.ts`): **`unit`** (node) for pure logic, **`browser`**
(`@vitest/browser` + Playwright chromium via `vitest-browser-svelte`) for components and the
rune-driven `toasts` store, as `*.svelte.test.ts`. `pnpm test` runs both.

Covered: `Field` (order, optional tag, hint/error ids, has-error, below states), `Input` /
`PasswordInput` (Field-context id + aria wiring, Show/Hide), `FormSummary`, and the `toasts`
store (add / auto-dismiss / dismiss / undo). `field-fixture.svelte` renders a real
Input/PasswordInput inside a Field for the context tests. `Banner` / `Toast` / `ToastHost` /
`MessageIcon` are verified in the showcase.
