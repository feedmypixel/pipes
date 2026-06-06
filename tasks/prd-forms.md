# PRD: Forms + notifications

## Introduction / Overview

The options forms work but are thin: no field-level validation, no inline/global errors, no
action feedback. This brings them up to standard. We **adopt the portal forms spec**
(`/Users/feedmypixel/Work/wid/portal/docs/forms.md` — field order, error placement,
validation triggers, ARIA, never-disabled submit) implemented in **Svelte 5 runes** (no
SuperForm, no server). We add an **in-app notification system** (toasts + inline banners)
and an **undo-on-delete** pattern, and we write Pipes' own forms docs.

Visual spec: `design/v2` (incoming, brief in `design/BRIEF-v2.md`).

## Goals

1. Reusable form primitives with the fixed field order and the ARIA contract.
2. Validation on **blur / input / submit** with inline + global errors.
3. Client validation for the add-connection form (valid host, token present).
4. Notifications: **toasts** (success/error/info) **and inline banners**.
5. **Undo-on-delete** for connection removal.
6. Component tests for all of the above; Pipes forms docs.

## User Stories

- I type an invalid host → red field + inline error on blur; it clears as I fix it.
- I submit with errors → a summary lists them and focuses the first.
- I remove a connection → a toast lets me undo for 5 seconds.
- An action succeeds or fails → a toast/banner tells me.

## Functional Requirements

1. **Form primitives** (`src/lib/components/forms/`): `Field` (label → hint → error → input →
   below; `(optional)` tag; ARIA: input `id` = name, `aria-describedby` chains hint + error,
   `aria-invalid` only when errored), `Input` (reads Field context), `PasswordInput`
   (Show/Hide), `FormSummary` (`role="alert"`, entries link to the failing field ids). Inline
   errors are text-only (no icon), in `--failed`, with a red input border.
2. **Validation triggers** (runes): `blur` runs the field's sync rules + toggles error;
   `input` re-validates only an already-errored field and clears it when valid (never a new
   error mid-typing); `submit` runs all rules, renders the summary, focuses the first error,
   blocks. Submit is **never disabled** (except an in-flight "Saving…").
3. **Client rules** for add-connection: host → `normaliseHost` must yield a valid origin;
   token → non-empty. Surfaced as field errors.
4. **Async availability**: the Validate probe result renders in the `below` line (busy / ok /
   bad), `aria-live="polite"`.
5. **Notifications**: a small notify store + a `Toast` host (success/error/info, auto-dismiss,
   stack, reduced-motion) **and** an inline banner (top-of-section). Both per the v2 design.
6. **Undo-on-delete**: removing a connection removes it optimistically + shows a ~5s undo
   toast; Undo restores it; it commits after the timeout.
7. **Stricter dev mock**: the dev-chrome `fetch` mock must not validate garbage (only succeed
   for plausible hosts/tokens), so the preview reflects reality.
8. **Tests**: `vitest-browser-svelte` component tests for `Field` (error states + triggers),
   the undo flow, and the add-connection validation. Set up the browser test project.
9. **Docs**: `docs/forms.md` (Pipes forms spec, adapted from the portal — drop SuperForm /
   SvelteKit specifics), linked from the README and the styles README.

## Non-Goals (Out of Scope)

- `Textarea` / `Select` / checkbox-group components (build when first needed).
- Any form library (no SuperForm; runes only).
- Server-side validation / CSRF — there is no server or session; writes are local
  `chrome.storage`. (Guards here: read-only tokens, never logged/synced, host-permission
  gated, CSP + Svelte escaping.)

## Design Considerations

- Visual spec `design/v2` (per `design/BRIEF-v2.md`); principles from the portal `forms.md`.
- Error tokens exist (`--failed`, `--failed-bg`, `--failed-line`); toast elevation via
  `--shadow-lg`. Flag any new token from the v2 bundle.

## Technical Considerations

- Svelte 5 runes; Field context via `setContext` / `getContext`. A small per-field validator
  (a rule returning a message or null) instead of a library.
- Notifications: a module-level runes store (or context) consumed by a `Toast` host mounted
  per surface.

## Success Metrics

- Invalid input shows inline + summary errors on blur/submit and clears on typing; actions
  toast; deletes are undoable; `pnpm check` / `lint` / `test` (incl. new component tests) green.

## Open Questions

1. Notification host: one `Toast` container per surface vs a shared mount.
2. Undo storage: hold the removed item in memory for 5s (simple) vs a tombstone in storage.
